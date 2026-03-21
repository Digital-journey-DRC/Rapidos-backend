import type { HttpContext } from '@adonisjs/core/http'
import CommandeExpress, { CommandeExpressStatus } from '#models/commande_express'
import CommandeExpressLog from '#models/commande_express_log'
import ClientExpress from '#models/client_express'
import PaymentMethod from '#models/payment_method'
import PaymentMethodTemplate from '#models/payment_method_template'
import { 
  initializeExpressOrderValidator, 
  updateExpressPaymentMethodValidator,
  updateExpressStatusValidator,
  createExpressClientValidator 
} from '#validators/express_order'
import { randomUUID } from 'node:crypto'
import logger from '@adonisjs/core/services/logger'
import ecommerceCloudinaryService from '#services/ecommerce_cloudinary_service'
import { DistanceCalculator } from '#services/distance_calculator'
import Product from '#models/product'
import db from '@adonisjs/lucid/services/db'
import { saveCommandeExpressToFirestore } from '#services/firebase_service'
import admin from 'firebase-admin'

export default class ExpressOrdersController {
  /**
   * POST /express/clients
   * Vendeur enregistre un nouveau client
   */
  async createClient({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user!
      
      if (user.role !== 'vendeur') {
        return response.status(403).json({
          success: false,
          message: 'Seuls les vendeurs peuvent enregistrer des clients',
        })
      }

      const payload = await request.validateUsing(createExpressClientValidator)

      const client = await ClientExpress.create({
        ...payload,
        vendorId: user.id,
      })

      return response.status(201).json({
        success: true,
        message: 'Client enregistré avec succès',
        client,
      })
    } catch (error) {
      logger.error('Erreur création client express', { error: error.message })
      return response.status(500).json({
        success: false,
        message: 'Erreur lors de l\'enregistrement du client',
        error: error.message,
      })
    }
  }

  /**
   * GET /express/clients/vendeur
   * Lister les clients du vendeur
   */
  async getVendorClients({ response, auth }: HttpContext) {
    try {
      const user = auth.user!
      
      if (user.role !== 'vendeur') {
        return response.status(403).json({
          success: false,
          message: 'Accès réservé aux vendeurs',
        })
      }

      const clients = await ClientExpress.query()
        .where('vendor_id', user.id)
        .orderBy('created_at', 'desc')

      return response.status(200).json({
        success: true,
        clients,
      })
    } catch (error) {
      logger.error('Erreur récupération clients', { error: error.message })
      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des clients',
      })
    }
  }

  /**
   * POST /express/commandes/initialize
   * Vendeur initialise une commande express
   */
  async initializeOrder({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user!
      
      if (user.role !== 'vendeur') {
        return response.status(403).json({
          success: false,
          message: 'Seuls les vendeurs peuvent créer des commandes express',
        })
      }

      const payload = await request.validateUsing(initializeExpressOrderValidator)

      // Vérifier que le client existe et appartient au vendeur
      const client = await ClientExpress.query()
        .where('id', payload.clientId)
        .where('vendor_id', user.id)
        .first()

      if (!client) {
        return response.status(404).json({
          success: false,
          message: 'Client non trouvé ou n\'appartient pas à ce vendeur',
        })
      }

      // Déterminer les coordonnées du client (priorité: payload > client_express)
      const clientLat = payload.latitude || client.latitude || null
      const clientLng = payload.longitude || client.longitude || null

      // Récupérer les coordonnées du vendeur
      const vendorLat = user.latitude || null
      const vendorLng = user.longitude || null

      // Calculer frais de livraison si coordonnées disponibles
      let deliveryFee = 0
      if (vendorLat && vendorLng && clientLat && clientLng) {
        const vendorCoords = { latitude: vendorLat, longitude: vendorLng }
        const clientCoords = { latitude: clientLat, longitude: clientLng }
        
        const distance = DistanceCalculator.calculateDistance(vendorCoords, clientCoords)
        deliveryFee = DistanceCalculator.calculateDeliveryFee(distance)
      }

      const totalAvecLivraison = payload.packageValue + deliveryFee

      // Générer code colis initial
      const initialCodeColis = Math.floor(1000 + Math.random() * 9000).toString()

      // === GESTION DU STOCK + ENRICHISSEMENT (dans une transaction) ===
      const trx = await db.transaction()

      try {
        // Séparer items avec/sans productId
        const itemsWithProduct = payload.items.filter((item) => item.productId)
        const stockErrors: any[] = []
        const stockUpdates: any[] = []
        let productMap = new Map<number, any>()

        // Charger les produits et vérifier le stock
        if (itemsWithProduct.length > 0) {
          const productIds = itemsWithProduct.map((item) => item.productId!)

          const products = await Product.query({ client: trx })
            .whereIn('id', productIds)
            .preload('media')
            .forUpdate() // Lock pour éviter les race conditions

          productMap = new Map(products.map((p) => [p.id, p]))

          // Vérifier le stock pour chaque item
          for (const item of itemsWithProduct) {
            const product = productMap.get(item.productId!)

            if (!product) {
              stockErrors.push({
                productId: item.productId,
                productName: item.name,
                error: 'Produit non trouvé',
              })
              continue
            }

            if (product.stock < item.quantity) {
              stockErrors.push({
                productId: item.productId,
                productName: item.name,
                requestedQuantity: item.quantity,
                availableStock: product.stock,
                error: 'Stock insuffisant',
              })
            }
          }

          // Si erreurs de stock, annuler
          if (stockErrors.length > 0) {
            await trx.rollback()
            return response.status(400).json({
              success: false,
              message: 'Stock insuffisant pour certains produits',
              errors: stockErrors,
            })
          }
        }

        // Enrichir les items avec les données produit (image, description, prix)
        const enrichedItems = payload.items.map((item) => {
          if (item.productId && productMap.has(item.productId)) {
            const product = productMap.get(item.productId)!
            return {
              productId: item.productId,
              name: item.name || product.name,
              description: item.description || product.description || null,
              price: item.price || product.price,
              quantity: item.quantity,
              weight: item.weight || null,
              urlProduct: item.urlProduct || product.media?.mediaUrl || null,
            }
          }
          return {
            productId: item.productId || null,
            name: item.name,
            description: item.description || null,
            price: item.price || null,
            quantity: item.quantity,
            weight: item.weight || null,
            urlProduct: item.urlProduct || null,
          }
        }) as any

        // Créer la commande dans la transaction
        const order = await CommandeExpress.create({
          orderId: randomUUID(),
          statut: CommandeExpressStatus.PENDING_PAYMENT,
          clientId: client.id,
          clientName: client.name,
          clientPhone: client.phone,
          vendorId: user.id,
          packageValue: payload.packageValue,
          packageDescription: payload.packageDescription,
          pickupAddress: payload.pickupAddress || '',
          deliveryAddress: payload.deliveryAddress || client.defaultAddress || '',
          pickupReference: payload.pickupReference || null,
          deliveryReference: payload.deliveryReference || client.defaultReference || null,
          createdBy: user.id,
          items: enrichedItems,
          deliveryPersonId: null,
          paymentMethodId: null,
          packagePhoto: null,
          packagePhotoPublicId: null,
          codeColis: initialCodeColis,
          deliveryFee,
          totalAvecLivraison,
          latitude: payload.latitude || null,
          longitude: payload.longitude || null,
          clientLatitude: clientLat,
          clientLongitude: clientLng,
          vendorLatitude: vendorLat,
          vendorLongitude: vendorLng,
          address: payload.address || null,
          numeroPayment: null,
        }, { client: trx })

        // Déduire le stock pour les items avec productId
        for (const item of itemsWithProduct) {
          const product = productMap.get(item.productId!)!
          const previousStock = product.stock

          await Product.query({ client: trx })
            .where('id', item.productId!)
            .decrement('stock', item.quantity)

          stockUpdates.push({
            productId: item.productId,
            productName: item.name,
            previousStock,
            newStock: previousStock - item.quantity,
            deducted: item.quantity,
          })
        }

        // Commit la transaction
        await trx.commit()

        // Logger la création (hors transaction)
        await CommandeExpressLog.create({
          logId: randomUUID(),
          orderId: order.orderId,
          oldStatus: null,
          newStatus: CommandeExpressStatus.PENDING_PAYMENT,
          changedBy: user.id,
          changedByRole: user.role,
          reason: 'Initialisation de la commande express',
        })

        // Enregistrer dans Firebase pour les notifications
        let firebaseDocId: string | null = null
        try {
          firebaseDocId = await saveCommandeExpressToFirestore({
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            orderId: order.orderId,
            clientId: order.clientId,
            clientName: order.clientName,
            clientPhone: order.clientPhone,
            vendorId: order.vendorId,
            packageValue: order.packageValue,
            packageDescription: order.packageDescription,
            pickupAddress: order.pickupAddress,
            deliveryAddress: order.deliveryAddress,
            pickupReference: order.pickupReference,
            deliveryReference: order.deliveryReference,
            statut: order.statut,
            items: order.items,
            deliveryPersonId: order.deliveryPersonId,
            createdBy: order.createdBy,
          })
          logger.info('Commande express enregistrée dans Firebase', {
            firebaseDocId,
            orderId: order.orderId,
          })
        } catch (firebaseError) {
          logger.error('Erreur Firebase (non bloquant)', { error: firebaseError.message })
        }

        if (stockUpdates.length > 0) {
          logger.info('Stock déduit pour commande express', {
            orderId: order.orderId,
            stockUpdates,
          })
        }

        return response.status(201).json({
          success: true,
          message: 'Commande express initialisée avec succès',
          order,
          stockUpdates: stockUpdates.length > 0 ? stockUpdates : undefined,
          firebaseDocId,
        })
      } catch (trxError) {
        await trx.rollback()
        throw trxError
      }
    } catch (error) {
      logger.error('Erreur initialisation commande express', { error: error.message })
      return response.status(500).json({
        success: false,
        message: 'Erreur lors de l\'initialisation de la commande',
        error: error.message,
      })
    }
  }

  /**
   * PATCH /express/commandes/:id/payment-method
   * Vendeur ajoute le moyen de paiement
   */
  async updatePaymentMethod({ request, response, auth, params }: HttpContext) {
    try {
      const user = auth.user!
      const orderId = params.id
      const payload = await request.validateUsing(updateExpressPaymentMethodValidator)

      const order = await CommandeExpress.find(orderId)

      if (!order) {
        return response.status(404).json({
          success: false,
          message: 'Commande non trouvée',
        })
      }

      // Vérifier que c'est le vendeur de la commande
      if (order.vendorId !== user.id) {
        return response.status(403).json({
          success: false,
          message: 'Vous n\'êtes pas autorisé à modifier cette commande',
        })
      }

      // Vérifier le moyen de paiement
      const paymentMethod = await PaymentMethod.find(payload.paymentMethodId)
      
      if (!paymentMethod || paymentMethod.vendeurId !== user.id || !paymentMethod.isActive) {
        return response.status(400).json({
          success: false,
          message: 'Moyen de paiement invalide',
        })
      }

      const oldStatus = order.statut
      const oldPaymentMethodId = order.paymentMethodId

      order.paymentMethodId = payload.paymentMethodId
      order.numeroPayment = payload.numeroPayment || null

      // Si c'était pending_payment et pas de moyen de paiement avant, passer à pending
      if (oldStatus === CommandeExpressStatus.PENDING_PAYMENT && oldPaymentMethodId === null) {
        order.statut = CommandeExpressStatus.PENDING
        
        await CommandeExpressLog.create({
          logId: randomUUID(),
          orderId: order.orderId,
          oldStatus: CommandeExpressStatus.PENDING_PAYMENT,
          newStatus: CommandeExpressStatus.PENDING,
          changedBy: user.id,
          changedByRole: user.role,
          reason: 'Moyen de paiement ajouté',
        })
      }

      await order.save()

      // Formater le moyen de paiement avec template
      const template = await PaymentMethodTemplate.query()
        .where('type', paymentMethod.type)
        .first()

      const formattedPaymentMethod = {
        id: paymentMethod.id,
        type: paymentMethod.type,
        name: template?.name || paymentMethod.type,
        imageUrl: template?.imageUrl || null,
        numeroCompte: paymentMethod.numeroCompte,
      }

      return response.status(200).json({
        success: true,
        message: 'Moyen de paiement mis à jour',
        order: {
          ...order.toJSON(),
          paymentMethod: formattedPaymentMethod,
        },
      })
    } catch (error) {
      logger.error('Erreur mise à jour moyen de paiement', { error: error.message })
      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour',
      })
    }
  }

  /**
   * GET /express/commandes/vendeur
   * Voir les commandes du vendeur
   */
  async getVendorOrders({ response, auth }: HttpContext) {
    try {
      const user = auth.user!
      
      if (user.role !== 'vendeur') {
        return response.status(403).json({
          success: false,
          message: 'Accès réservé aux vendeurs',
        })
      }

      const orders = await CommandeExpress.query()
        .where('vendor_id', user.id)
        .where('statut', '!=', CommandeExpressStatus.PENDING_PAYMENT)
        .orderBy('created_at', 'desc')

      // Enrichir les items avec les images produit si productId présent
      const enrichedOrders = await this.enrichDeliveriesItems(orders)

      return response.status(200).json({
        success: true,
        commandes: enrichedOrders,
      })
    } catch (error) {
      logger.error('Erreur récupération commandes vendeur', { error: error.message })
      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des commandes',
      })
    }
  }

  /**
   * PATCH /express/commandes/:id/status
   * Mettre à jour le statut d'une commande
   */
  async updateStatus({ request, response, auth, params }: HttpContext) {
    try {
      const user = auth.user!
      const orderId = params.id
      const payload = await request.validateUsing(updateExpressStatusValidator)

      const order = await CommandeExpress.find(orderId)

      if (!order) {
        return response.status(404).json({
          success: false,
          message: 'Commande non trouvée',
        })
      }

      // Vérifications de permissions
      const canTransition = this.canTransitionStatus(
        order.statut,
        payload.status,
        user.role,
        user.id,
        order
      )

      if (!canTransition.allowed) {
        return response.status(403).json({
          success: false,
          message: canTransition.reason || 'Transition non autorisée',
        })
      }

      // Vérification photo pour pret_a_expedier et génération nouveau code
      if (payload.status === CommandeExpressStatus.PRET_A_EXPEDIER) {
        if (!order.packagePhoto) {
          return response.status(400).json({
            success: false,
            message: 'Photo du colis obligatoire pour marquer prêt à expédier',
          })
        }
        // Générer nouveau code pour le livreur
        const newCodeForDelivery = Math.floor(1000 + Math.random() * 9000).toString()
        order.codeColis = newCodeForDelivery
      }

      // Assigner le livreur quand il accepte
      if (payload.status === CommandeExpressStatus.ACCEPTE_LIVREUR) {
        order.deliveryPersonId = user.id
      }

      // Vérification code colis pour en_route
      if (payload.status === CommandeExpressStatus.EN_ROUTE) {
        if (!order.deliveryPersonId || order.deliveryPersonId !== user.id) {
          return response.status(403).json({
            success: false,
            message: 'Seul le livreur assigné peut marquer en route',
          })
        }

        const codeColis = request.input('codeColis')
        if (!codeColis) {
          return response.status(400).json({
            success: false,
            message: 'Le code du colis est requis pour marquer en route',
          })
        }

        if (codeColis !== order.codeColis) {
          return response.status(400).json({
            success: false,
            message: 'Code du colis incorrect',
          })
        }

        // Générer nouveau code pour la livraison
        const newCode = Math.floor(1000 + Math.random() * 9000).toString()
        order.codeColis = newCode
      }

      // Vérification code pour delivered
      if (payload.status === CommandeExpressStatus.DELIVERED) {
        const codeColis = request.input('codeColis')
        if (!codeColis) {
          return response.status(400).json({
            success: false,
            message: 'Le code de confirmation est requis',
          })
        }

        if (codeColis !== order.codeColis) {
          return response.status(400).json({
            success: false,
            message: 'Code de confirmation incorrect',
          })
        }
      }

      const oldStatus = order.statut
      order.statut = payload.status as CommandeExpressStatus
      await order.save()

      // Logger le changement
      await CommandeExpressLog.create({
        logId: randomUUID(),
        orderId: order.orderId,
        oldStatus,
        newStatus: payload.status,
        changedBy: user.id,
        changedByRole: user.role,
        reason: payload.reason || null,
      })

      // **ENVOI SMS AUTOMATIQUE QUAND EN_ROUTE**
      if (payload.status === CommandeExpressStatus.EN_ROUTE && order.clientPhone) {
        try {
          const client = await ClientExpress.find(order.clientId)
          if (client) {
            // TODO: Intégrer votre service SMS ici
            logger.info('SMS à envoyer au client', {
              phone: client.phone,
              message: `Votre colis est en route! Code de livraison: ${order.codeColis}`,
              orderId: order.orderId,
            })
          }
        } catch (smsError) {
          logger.error('Erreur envoi SMS', { error: smsError.message })
        }
      }

      let message = `Statut mis à jour de "${oldStatus}" vers "${payload.status}"`
      const responseData: any = {
        success: true,
        message,
        order,
      }

      if (payload.status === CommandeExpressStatus.EN_ROUTE && order.codeColis) {
        responseData.newCodeColis = order.codeColis
        responseData.message = `${message}. Nouveau code de confirmation généré : ${order.codeColis}`
      }

      return response.status(200).json(responseData)
    } catch (error) {
      logger.error('Erreur mise à jour statut', { error: error.message })
      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du statut',
      })
    }
  }

  /**
   * POST /express/commandes/:id/upload-package-photo
   * Upload photo du colis (vendeur)
   */
  async uploadPackagePhoto({ request, response, auth, params }: HttpContext) {
    try {
      const user = auth.user!
      const orderId = params.id

      if (user.role !== 'vendeur') {
        return response.status(403).json({
          success: false,
          message: 'Seuls les vendeurs peuvent uploader des photos',
        })
      }

      const order = await CommandeExpress.find(orderId)

      if (!order) {
        return response.status(404).json({
          success: false,
          message: 'Commande non trouvée',
        })
      }

      if (order.vendorId !== user.id) {
        return response.status(403).json({
          success: false,
          message: 'Vous n\'êtes pas autorisé à modifier cette commande',
        })
      }

      if (order.statut !== CommandeExpressStatus.EN_PREPARATION) {
        return response.status(400).json({
          success: false,
          message: 'La commande doit être en préparation pour uploader une photo',
        })
      }

      const packagePhoto = request.file('packagePhoto', {
        size: '5mb',
        extnames: ['jpg', 'jpeg', 'png', 'webp'],
      })

      if (!packagePhoto) {
        return response.status(400).json({
          success: false,
          message: 'Aucune photo fournie. Le champ doit être nommé "packagePhoto"',
        })
      }

      // Supprimer ancienne photo si existe
      if (order.packagePhotoPublicId) {
        try {
          const cloudinary = (await import('cloudinary')).v2
          await cloudinary.uploader.destroy(order.packagePhotoPublicId)
        } catch (error) {
          logger.warn('Erreur suppression ancienne photo', { error })
        }
      }

      // Upload nouvelle photo
      const uploadResult = await ecommerceCloudinaryService.uploadPackagePhoto(
        packagePhoto.tmpPath!,
        order.orderId
      )

      order.packagePhoto = uploadResult.url
      order.packagePhotoPublicId = uploadResult.publicId
      await order.save()

      return response.status(200).json({
        success: true,
        message: 'Photo du colis uploadée et code généré avec succès',
        data: {
          orderId: order.orderId,
          packagePhoto: order.packagePhoto,
          codeColis: order.codeColis,
        },
      })
    } catch (error) {
      logger.error('Erreur upload photo colis', { error: error.message })
      return response.status(500).json({
        success: false,
        message: 'Erreur lors de l\'upload de la photo',
      })
    }
  }

  /**
   * GET /express/livraison/disponibles
   * Livraisons disponibles (livreur)
   */
  async getAvailableDeliveries({ response, auth }: HttpContext) {
    try {
      const user = auth.user!
      
      if (user.role !== 'livreur') {
        return response.status(403).json({
          success: false,
          message: 'Accès réservé aux livreurs',
        })
      }

      const deliveries = await CommandeExpress.query()
        .where('statut', CommandeExpressStatus.PRET_A_EXPEDIER)
        .whereNull('delivery_person_id')
        .orderBy('created_at', 'desc')

      // Enrichir les items avec les images produit si productId présent
      const enrichedDeliveries = await this.enrichDeliveriesItems(deliveries)

      return response.status(200).json({
        success: true,
        deliveries: enrichedDeliveries,
      })
    } catch (error) {
      logger.error('Erreur récupération livraisons', { error: error.message })
      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des livraisons',
      })
    }
  }

  /**
   * GET /express/livraison/mes-livraisons
   * Livraisons en cours du livreur connecté
   */
  async getMyDeliveries({ response, auth }: HttpContext) {
    try {
      const user = auth.user!
      
      if (user.role !== 'livreur') {
        return response.status(403).json({
          success: false,
          message: 'Accès réservé aux livreurs',
        })
      }

      const deliveries = await CommandeExpress.query()
        .where('delivery_person_id', user.id)
        .whereIn('statut', [
          CommandeExpressStatus.ACCEPTE_LIVREUR,
          CommandeExpressStatus.EN_ROUTE,
        ])
        .orderBy('updated_at', 'desc')

      // Enrichir les items avec les images produit si productId présent
      const enrichedDeliveries = await this.enrichDeliveriesItems(deliveries)

      return response.status(200).json({
        success: true,
        deliveries: enrichedDeliveries,
      })
    } catch (error) {
      logger.error('Erreur récupération mes livraisons', { error: error.message })
      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de vos livraisons',
      })
    }
  }

  /**
   * POST /express/livraison/:id/take
   * Livreur prend une livraison
   */
  async takeDelivery({ response, auth, params }: HttpContext) {
    try {
      const user = auth.user!
      const orderId = params.id

      if (user.role !== 'livreur') {
        return response.status(403).json({
          success: false,
          message: 'Seuls les livreurs peuvent prendre des livraisons',
        })
      }

      const order = await CommandeExpress.find(orderId)

      if (!order) {
        return response.status(404).json({
          success: false,
          message: 'Commande non trouvée',
        })
      }

      if (order.deliveryPersonId) {
        return response.status(400).json({
          success: false,
          message: 'Cette commande est déjà assignée à un livreur',
        })
      }

      if (order.statut !== CommandeExpressStatus.PRET_A_EXPEDIER) {
        return response.status(400).json({
          success: false,
          message: 'Cette commande n\'est pas prête à être expédiée',
        })
      }

      order.deliveryPersonId = user.id
      order.statut = CommandeExpressStatus.ACCEPTE_LIVREUR
      await order.save()

      await CommandeExpressLog.create({
        logId: randomUUID(),
        orderId: order.orderId,
        oldStatus: CommandeExpressStatus.PRET_A_EXPEDIER,
        newStatus: CommandeExpressStatus.ACCEPTE_LIVREUR,
        changedBy: user.id,
        changedByRole: user.role,
        reason: 'Livraison acceptée par le livreur',
      })

      return response.status(200).json({
        success: true,
        message: 'Livraison prise en charge avec succès',
        order,
      })
    } catch (error) {
      logger.error('Erreur prise livraison', { error: error.message })
      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la prise en charge',
      })
    }
  }

  /**
   * Vérifier si une transition de statut est autorisée
   */
  private canTransitionStatus(
    currentStatus: CommandeExpressStatus,
    newStatus: string,
    userRole: string,
    userId: number,
    order: CommandeExpress
  ): { allowed: boolean; reason?: string } {
    if (currentStatus === CommandeExpressStatus.DELIVERED) {
      return { allowed: false, reason: 'La commande est déjà livrée' }
    }

    const transitions: Record<string, any> = {
      [CommandeExpressStatus.PENDING_PAYMENT]: {
        [CommandeExpressStatus.PENDING]: ['vendeur'],
        [CommandeExpressStatus.CANCELLED]: ['vendeur'],
      },
      [CommandeExpressStatus.PENDING]: {
        [CommandeExpressStatus.EN_PREPARATION]: ['vendeur'],
        [CommandeExpressStatus.CANCELLED]: ['vendeur'],
        [CommandeExpressStatus.REJECTED]: ['vendeur'],
      },
      [CommandeExpressStatus.EN_PREPARATION]: {
        [CommandeExpressStatus.PRET_A_EXPEDIER]: ['vendeur'],
        [CommandeExpressStatus.CANCELLED]: ['vendeur'],
      },
      [CommandeExpressStatus.PRET_A_EXPEDIER]: {
        [CommandeExpressStatus.ACCEPTE_LIVREUR]: ['livreur'],
        [CommandeExpressStatus.CANCELLED]: ['vendeur', 'livreur'],
      },
      [CommandeExpressStatus.ACCEPTE_LIVREUR]: {
        [CommandeExpressStatus.EN_ROUTE]: ['livreur'],
        [CommandeExpressStatus.CANCELLED]: ['vendeur', 'livreur'],
      },
      [CommandeExpressStatus.EN_ROUTE]: {
        [CommandeExpressStatus.DELIVERED]: ['livreur'],
        [CommandeExpressStatus.CANCELLED]: ['livreur'],
      },
    }

    const allowedTransitions = transitions[currentStatus]
    if (!allowedTransitions) {
      return { allowed: false, reason: `Statut actuel "${currentStatus}" invalide` }
    }

    const allowedRoles = allowedTransitions[newStatus]
    if (!allowedRoles) {
      return {
        allowed: false,
        reason: `Transition de "${currentStatus}" vers "${newStatus}" non autorisée`,
      }
    }

    if (!allowedRoles.includes(userRole)) {
      return {
        allowed: false,
        reason: `Votre rôle (${userRole}) ne permet pas cette transition`,
      }
    }

    // Vérifications spécifiques vendeur
    if (userRole === 'vendeur' && order.vendorId !== userId) {
      return {
        allowed: false,
        reason: 'Vous n\'êtes pas le vendeur de cette commande',
      }
    }

    // Vérifications spécifiques livreur
    if (userRole === 'livreur' && newStatus !== CommandeExpressStatus.ACCEPTE_LIVREUR) {
      if (!order.deliveryPersonId || order.deliveryPersonId !== userId) {
        return {
          allowed: false,
          reason: 'Vous n\'êtes pas le livreur assigné à cette commande',
        }
      }
    }

    return { allowed: true }
  }

  /**
   * Enrichit les items des livraisons avec les données produit (image, description, prix)
   * Pour les items ayant un productId, récupère urlProduct depuis product.media
   */
  private async enrichDeliveriesItems(deliveries: CommandeExpress[]): Promise<any[]> {
    // Collecter tous les productIds uniques
    const allProductIds = new Set<number>()
    for (const delivery of deliveries) {
      const items = delivery.items as any[]
      if (Array.isArray(items)) {
        for (const item of items) {
          if (item.productId) {
            allProductIds.add(item.productId)
          }
        }
      }
    }

    // Si aucun productId, retourner tel quel avec structure normalisée
    if (allProductIds.size === 0) {
      return deliveries.map((d) => {
        const json = d.toJSON()
        json.items = this.normalizeItems(json.items)
        return json
      })
    }

    // Charger tous les produits avec leurs médias en une seule requête
    const products = await Product.query()
      .whereIn('id', Array.from(allProductIds))
      .preload('media')

    const productMap = new Map<number, any>()
    for (const product of products) {
      productMap.set(product.id, product)
    }

    // Enrichir chaque livraison
    return deliveries.map((delivery) => {
      const json = delivery.toJSON()
      const items = json.items as any[]

      if (Array.isArray(items)) {
        json.items = items.map((item: any) => {
          if (item.productId && productMap.has(item.productId)) {
            const product = productMap.get(item.productId)
            return {
              productId: item.productId,
              name: item.name || product.name,
              description: item.description || product.description || null,
              price: item.price || product.price,
              quantity: item.quantity,
              weight: item.weight || null,
              urlProduct: item.urlProduct || product.media?.mediaUrl || null,
            }
          }
          return {
            productId: item.productId || null,
            name: item.name,
            description: item.description || null,
            price: item.price || null,
            quantity: item.quantity,
            weight: item.weight || null,
            urlProduct: item.urlProduct || null,
          }
        })
      }

      return json
    })
  }

  /**
   * Normalise les items pour toujours retourner les 7 champs
   */
  private normalizeItems(items: any[]): any[] {
    if (!Array.isArray(items)) return items
    return items.map((item: any) => ({
      productId: item.productId || null,
      name: item.name,
      description: item.description || null,
      price: item.price || null,
      quantity: item.quantity,
      weight: item.weight || null,
      urlProduct: item.urlProduct || null,
    }))
  }
}
