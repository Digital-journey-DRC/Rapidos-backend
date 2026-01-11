import type { HttpContext } from '@adonisjs/core/http'
import EcommerceOrder, { EcommerceOrderStatus } from '#models/ecommerce_order'
import EcommerceOrderLog from '#models/ecommerce_order_log'
import { createOrderValidator, updateStatusValidator, initializeOrderValidator, updatePaymentMethodValidator, batchUpdatePaymentMethodsValidator } from '#validators/ecommerce_order'
import { randomUUID } from 'node:crypto'
import logger from '@adonisjs/core/services/logger'
import ecommerceCloudinaryService from '#services/ecommerce_cloudinary_service'
import db from '@adonisjs/lucid/services/db'
import PaymentMethod from '#models/payment_method'
import PaymentMethodTemplate from '#models/payment_method_template'
import { DistanceCalculator } from '#services/distance_calculator'
import Product from '#models/product'
import User from '#models/user'
import Media from '#models/media'
import { UserRole } from '../Enum/user_role.js'
import { saveOrderToFirestore, notifyVendors, updateOrderInFirestore, saveLocationToFirestore, admin } from '#services/firebase_service'

export default class EcommerceOrdersController {
  /**
   * ENDPOINT TEMPORAIRE: Créer les tables ecommerce
   * GET /ecommerce/create-tables
   */
  async createTables({ response }: HttpContext) {
    try {
      // Créer table ecommerce_orders
      await db.rawQuery(`
        CREATE TABLE IF NOT EXISTS ecommerce_orders (
          id SERIAL PRIMARY KEY,
          order_id VARCHAR(255) NOT NULL UNIQUE,
          status VARCHAR(255) NOT NULL DEFAULT 'pending',
          client_id INTEGER NOT NULL,
          client VARCHAR(255) NOT NULL,
          phone VARCHAR(255) NOT NULL,
          vendor_id INTEGER NOT NULL,
          delivery_person_id INTEGER,
          items JSONB NOT NULL,
          address JSONB NOT NULL,
          total DECIMAL(10, 2) NOT NULL,
          package_photo VARCHAR(500),
          package_photo_public_id VARCHAR(500),
          payment_method_id INTEGER,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT fk_payment_method FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE SET NULL
        );
        
        CREATE INDEX IF NOT EXISTS idx_ecommerce_orders_order_id ON ecommerce_orders(order_id);
        CREATE INDEX IF NOT EXISTS idx_ecommerce_orders_client_id ON ecommerce_orders(client_id);
        CREATE INDEX IF NOT EXISTS idx_ecommerce_orders_vendor_id ON ecommerce_orders(vendor_id);
        CREATE INDEX IF NOT EXISTS idx_ecommerce_orders_delivery_person_id ON ecommerce_orders(delivery_person_id);
        CREATE INDEX IF NOT EXISTS idx_ecommerce_orders_status ON ecommerce_orders(status);
      `)

      // Créer table ecommerce_order_logs
      await db.rawQuery(`
        CREATE TABLE IF NOT EXISTS ecommerce_order_logs (
          id SERIAL PRIMARY KEY,
          log_id VARCHAR(255) NOT NULL UNIQUE,
          order_id VARCHAR(255) NOT NULL,
          old_status VARCHAR(255) NOT NULL,
          new_status VARCHAR(255) NOT NULL,
          changed_by INTEGER NOT NULL,
          changed_by_role VARCHAR(255) NOT NULL,
          reason TEXT,
          timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_ecommerce_order_logs_order_id ON ecommerce_order_logs(order_id);
        CREATE INDEX IF NOT EXISTS idx_ecommerce_order_logs_changed_by ON ecommerce_order_logs(changed_by);
        CREATE INDEX IF NOT EXISTS idx_ecommerce_order_logs_timestamp ON ecommerce_order_logs(timestamp);
      `)

      return response.status(200).json({
        success: true,
        message: 'Tables ecommerce_orders et ecommerce_order_logs créées avec succès',
      })
    } catch (error) {
      logger.error('Erreur création tables ecommerce', {
        error: error.message,
        stack: error.stack,
      })

      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la création des tables',
        error: error.message,
      })
    }
  }

  /**
   * POST /ecommerce/commandes/store
   * Créer une nouvelle commande e-commerce
   */
  async store({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user!
      const payload = await request.validateUsing(createOrderValidator)

      // Calculer le total
      const total = payload.produits.reduce(
        (sum, item) => sum + item.prix * item.quantite,
        0
      )

      // Déterminer le vendeur principal (premier produit)
      const vendorId = payload.produits[0].idVendeur

      // Vérifier le moyen de paiement si fourni
      let paymentMethodId = null
      if (payload.paymentMethodId) {
        const paymentMethod = await PaymentMethod.find(payload.paymentMethodId)
        
        if (!paymentMethod) {
          return response.status(404).json({
            success: false,
            message: 'Moyen de paiement non trouvé',
          })
        }

        // Vérifier que le moyen de paiement appartient au vendeur
        if (paymentMethod.vendeurId !== vendorId) {
          return response.status(403).json({
            success: false,
            message: 'Le moyen de paiement sélectionné n\'appartient pas au vendeur de cette commande',
          })
        }

        // Vérifier que le moyen de paiement est actif
        if (!paymentMethod.isActive) {
          return response.status(400).json({
            success: false,
            message: 'Le moyen de paiement sélectionné n\'est pas actif',
          })
        }

        paymentMethodId = paymentMethod.id
      }

      // Créer la commande
      const order = await EcommerceOrder.create({
        orderId: randomUUID(),
        status: EcommerceOrderStatus.PENDING,
        clientId: user.id,
        client: (user as any).fullName || user.email,
        phone: (user as any).phone || '',
        vendorId: vendorId,
        deliveryPersonId: null,
        items: payload.produits.map((p) => ({
          productId: p.id,
          name: p.nom,
          price: p.prix,
          quantity: p.quantite,
          idVendeur: p.idVendeur,
        })),
        address: {
          ville: payload.ville,
          commune: payload.commune,
          quartier: payload.quartier,
          avenue: payload.avenue,
          numero: payload.numero,
          pays: payload.pays,
          codePostale: payload.codePostale,
        },
        total: total,
        packagePhoto: null,
        packagePhotoPublicId: null,
        paymentMethodId: paymentMethodId,
      })

      // Logger la création
      await EcommerceOrderLog.create({
        logId: randomUUID(),
        orderId: order.orderId,
        oldStatus: '',
        newStatus: EcommerceOrderStatus.PENDING,
        changedBy: user.id,
        changedByRole: user.role,
        reason: null,
      })

      // Recharger la commande avec le moyen de paiement si fourni
      if (paymentMethodId) {
        await order.load('paymentMethod')
      }

      // Récupérer le template pour l'image si un moyen de paiement est fourni
      let formattedPaymentMethod = null
      if (order.paymentMethod) {
        const template = await PaymentMethodTemplate.query()
          .where('type', order.paymentMethod.type)
          .first()

        formattedPaymentMethod = {
          id: order.paymentMethod.id,
          type: order.paymentMethod.type,
          numeroCompte: order.paymentMethod.numeroCompte,
          nomTitulaire: order.paymentMethod.nomTitulaire,
          isDefault: order.paymentMethod.isDefault,
          isActive: order.paymentMethod.isActive,
          imageUrl: template?.imageUrl || null,
          name: template?.name || order.paymentMethod.type,
        }
      }

      return response.status(201).json({
        success: true,
        orderId: order.orderId,
        status: order.status,
        paymentMethod: formattedPaymentMethod,
        message: 'Commande créée avec succès',
      })
    } catch (error) {
      logger.error('Erreur création commande e-commerce', {
        error: error.message,
        stack: error.stack,
      })

      if (error.messages) {
        return response.status(422).json({
          success: false,
          errors: error.messages,
        })
      }

      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la commande',
      })
    }
  }

  /**
   * GET /ecommerce/commandes/acheteur
   * Récupérer toutes les commandes du client
   */
  async getOrdersByBuyer({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user!
      const status = request.input('status')

      const query = EcommerceOrder.query()
        .where('client_id', user.id)
        .preload('paymentMethod')
        .orderBy('createdAt', 'desc')

      // Filtrer par statut si fourni
      if (status) {
        query.where('status', status)
      }

      const orders = await query

      // Récupérer tous les templates pour les images
      const templates = await PaymentMethodTemplate.query()
      const templatesMap = new Map(templates.map(t => [t.type, t]))

      // Formater les commandes pour inclure le type de moyen de paiement avec image
      const formattedOrders = orders.map((order) => {
        const serialized = order.serialize()
        const paymentMethod = order.paymentMethod
          ? (() => {
              const template = templatesMap.get(order.paymentMethod.type)
              return {
                id: order.paymentMethod.id,
                type: order.paymentMethod.type,
                numeroCompte: order.paymentMethod.numeroCompte,
                nomTitulaire: order.paymentMethod.nomTitulaire,
                isDefault: order.paymentMethod.isDefault,
                isActive: order.paymentMethod.isActive,
                imageUrl: template?.imageUrl || null,
                name: template?.name || order.paymentMethod.type,
              }
            })()
          : {
              id: null,
              type: null,
              numeroCompte: null,
              nomTitulaire: null,
              isDefault: false,
              isActive: false,
              imageUrl: null,
              name: null,
            }

        return {
          ...serialized,
          paymentMethod,
        }
      })

      return response.status(200).json({
        success: true,
        commandes: formattedOrders,
      })
    } catch (error) {
      logger.error('Erreur récupération commandes acheteur', {
        error: error.message,
        stack: error.stack,
      })

      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des commandes',
      })
    }
  }

  /**
   * GET /ecommerce/commandes/vendeur
   * Récupérer les commandes d'un vendeur
   * Exclut les commandes avec le statut "pending_payment"
   */
  async getOrdersByVendor({ response, auth }: HttpContext) {
    try {
      const user = auth.user!

      const orders = await EcommerceOrder.query()
        .where('vendor_id', user.id)
        .where('status', '!=', EcommerceOrderStatus.PENDING_PAYMENT)
        .preload('paymentMethod')
        .preload('clientUser')
        .orderBy('createdAt', 'desc')

      // Récupérer tous les templates pour les images
      const templates = await PaymentMethodTemplate.query()
      const templatesMap = new Map(templates.map(t => [t.type, t]))

      // Formater les commandes pour inclure le type de moyen de paiement avec image et infos client
      const formattedOrders = orders.map((order) => {
        const serialized = order.serialize()
        const paymentMethod = order.paymentMethod
          ? (() => {
              const template = templatesMap.get(order.paymentMethod.type)
              return {
                id: order.paymentMethod.id,
                type: order.paymentMethod.type,
                numeroCompte: order.paymentMethod.numeroCompte,
                nomTitulaire: order.paymentMethod.nomTitulaire,
                isDefault: order.paymentMethod.isDefault,
                isActive: order.paymentMethod.isActive,
                imageUrl: template?.imageUrl || null,
                name: template?.name || order.paymentMethod.type,
              }
            })()
          : null

        return {
          ...serialized,
          clientName: order.clientUser 
            ? `${order.clientUser.firstName || ''} ${order.clientUser.lastName || ''}`.trim() 
            : serialized.client,
          clientPhone: order.clientUser?.phone || serialized.phone,
          paymentMethod,
        }
      })

      return response.status(200).json({
        success: true,
        commandes: formattedOrders,
      })
    } catch (error) {
      logger.error('Erreur récupération commandes vendeur', {
        error: error.message,
        stack: error.stack,
      })

      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des commandes',
      })
    }
  }

  /**
   * GET /ecommerce/livraison/ma-liste
   * Récupérer les livraisons disponibles et en cours pour un livreur
   */
  async getDeliveriesList({ response }: HttpContext) {
    try {
      const deliveries = await EcommerceOrder.query()
        .whereIn('status', [
          EcommerceOrderStatus.PRET_A_EXPEDIER,
          EcommerceOrderStatus.ACCEPTE_LIVREUR,
          EcommerceOrderStatus.EN_ROUTE,
          EcommerceOrderStatus.DELIVERED,
        ])
        .preload('paymentMethod')
        .preload('vendor')
        .preload('clientUser')
        .orderBy('createdAt', 'desc')

      // Formater les livraisons pour inclure le type de moyen de paiement et les infos vendeur/client
      const formattedDeliveries = deliveries.map((order) => {
        const serialized = order.serialize()
        return {
          ...serialized,
          clientName: order.clientUser 
            ? `${order.clientUser.firstName || ''} ${order.clientUser.lastName || ''}`.trim() 
            : serialized.client,
          vendorName: order.vendor 
            ? `${order.vendor.firstName || ''} ${order.vendor.lastName || ''}`.trim() 
            : null,
          vendorPhone: order.vendor?.phone || null,
          paymentMethod: order.paymentMethod
            ? {
                id: order.paymentMethod.id,
                type: order.paymentMethod.type,
                numeroCompte: order.paymentMethod.numeroCompte,
                nomTitulaire: order.paymentMethod.nomTitulaire,
                isDefault: order.paymentMethod.isDefault,
                isActive: order.paymentMethod.isActive,
              }
            : null,
        }
      })

      return response.status(200).json({
        success: true,
        livraison: formattedDeliveries,
      })
    } catch (error) {
      logger.error('Erreur récupération liste livraisons', {
        error: error.message,
        stack: error.stack,
      })

      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des livraisons',
      })
    }
  }

  /**
   * PATCH /ecommerce/commandes/:id/status
   * Mettre à jour le statut d'une commande
   */
  async updateStatus({ request, response, auth, params }: HttpContext) {
    try {
      const user = auth.user!
      const { id } = params
      const payload = await request.validateUsing(updateStatusValidator)

      const order = await EcommerceOrder.find(id)
      if (!order) {
        return response.status(404).json({
          success: false,
          message: 'Commande non trouvée',
        })
      }

      // Vérifier les permissions et transitions autorisées
      const canTransition = this.canTransitionStatus(
        order.status,
        payload.status,
        user.role,
        user.id,
        order
      )

      if (!canTransition.allowed) {
        return response.status(403).json({
          success: false,
          message: canTransition.reason,
        })
      }

      // Vérification photo et code obligatoires pour "prêt à expédier"
      if (payload.status === EcommerceOrderStatus.PRET_A_EXPEDIER) {
        if (!order.packagePhoto || !order.codeColis) {
          return response.status(400).json({
            success: false,
            message: 'Photo du colis et code obligatoires pour marquer prêt à expédier. Utilisez l\'endpoint /upload-package-photo d\'abord.',
          })
        }
      }

      // Assigner le livreur quand il accepte la commande
      if (payload.status === EcommerceOrderStatus.ACCEPTE_LIVREUR) {
        order.deliveryPersonId = user.id
      }

      // Vérification code colis pour passer à "en route"
      if (payload.status === EcommerceOrderStatus.EN_ROUTE) {
        // Vérifier que le livreur est assigné à cette commande
        if (!order.deliveryPersonId || order.deliveryPersonId !== user.id) {
          return response.status(403).json({
            success: false,
            message: 'Cette commande ne vous est pas assignée.',
          })
        }

        // Vérifier que le code du colis est fourni et correct
        const codeColis = request.input('codeColis')
        if (!codeColis) {
          return response.status(400).json({
            success: false,
            message: 'Le code du colis est requis pour marquer en route.',
          })
        }

        if (codeColis !== order.codeColis) {
          return response.status(400).json({
            success: false,
            message: 'Code du colis incorrect. Vérifiez avec le vendeur.',
          })
        }

        // Générer un NOUVEAU code pour la confirmation de livraison
        let newCodeColis: string
        let isUnique = false
        let attempts = 0
        const maxAttempts = 100

        while (!isUnique && attempts < maxAttempts) {
          newCodeColis = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
          
          const existingOrder = await EcommerceOrder.query()
            .where('code_colis', newCodeColis)
            .andWhere('id', '!=', order.id)
            .first()

          if (!existingOrder) {
            isUnique = true
          }
          attempts++
        }

        if (!isUnique) {
          return response.status(500).json({
            success: false,
            message: 'Impossible de générer un nouveau code. Veuillez réessayer.',
          })
        }

        // Remplacer le code par le nouveau code de livraison
        order.codeColis = newCodeColis!
      }

      // Vérification code colis pour passer à "delivered"
      if (payload.status === EcommerceOrderStatus.DELIVERED) {
        // Vérifier que le code de confirmation est fourni et correct
        const codeColis = request.input('codeColis')
        if (!codeColis) {
          return response.status(400).json({
            success: false,
            message: 'Le code de confirmation est requis pour marquer comme livré.',
          })
        }

        if (codeColis !== order.codeColis) {
          return response.status(400).json({
            success: false,
            message: 'Code de confirmation incorrect.',
          })
        }
      }

      // Logger le changement
      await EcommerceOrderLog.create({
        logId: randomUUID(),
        orderId: order.orderId,
        oldStatus: order.status,
        newStatus: payload.status,
        changedBy: user.id,
        changedByRole: user.role,
        reason: payload.reason || null,
      })

      // Mettre à jour le statut
      const oldStatus = order.status
      order.status = payload.status as EcommerceOrderStatus
      await order.save()

      // Mise à jour Firestore si statut "prêt à expédier" et firebaseOrderId existe
      if (payload.status === EcommerceOrderStatus.PRET_A_EXPEDIER && order.firebaseOrderId) {
        await updateOrderInFirestore(order.firebaseOrderId, {
          status: 'pret_a_expedier',
          packagePhoto: order.packagePhoto,
        })
      }

      // Recharger le moyen de paiement
      await order.load('paymentMethod')

      // Formater le moyen de paiement pour inclure le type
      const formattedPaymentMethod = order.paymentMethod
        ? {
            id: order.paymentMethod.id,
            type: order.paymentMethod.type,
            numeroCompte: order.paymentMethod.numeroCompte,
            nomTitulaire: order.paymentMethod.nomTitulaire,
            isDefault: order.paymentMethod.isDefault,
            isActive: order.paymentMethod.isActive,
          }
        : null

      const serializedOrder = order.serialize()
      const formattedOrder = {
        ...serializedOrder,
        paymentMethod: formattedPaymentMethod,
      }

      // Construire le message et inclure le nouveau code si passage à en_route
      let message = `Statut mis à jour de "${oldStatus}" vers "${payload.status}"`
      const responseData: any = {
        success: true,
        order: formattedOrder,
        message: message,
      }

      // Si on vient de passer à en_route, renvoyer le nouveau code de confirmation
      if (payload.status === EcommerceOrderStatus.EN_ROUTE && order.codeColis) {
        responseData.newCodeColis = order.codeColis
        responseData.message = `${message}. Nouveau code de confirmation généré : ${order.codeColis}`
      }

      return response.status(200).json(responseData)
    } catch (error) {
      logger.error('Erreur mise à jour statut commande', {
        error: error.message,
        stack: error.stack,
      })

      if (error.messages) {
        return response.status(422).json({
          success: false,
          errors: error.messages,
        })
      }

      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du statut',
      })
    }
  }

  /**
   * GET /ecommerce/livraison/disponibles
   * Récupérer uniquement les commandes prêtes à être expédiées (statut pret_a_expedier)
   * Pour les livreurs
   */
  async getAvailableDeliveries({ response, auth }: HttpContext) {
    try {
      const user = auth.user!

      // Vérifier que l'utilisateur est un livreur
      if (user.role !== 'livreur') {
        return response.status(403).json({
          success: false,
          message: 'Seuls les livreurs peuvent consulter les livraisons disponibles',
        })
      }

      const deliveries = await EcommerceOrder.query()
        .where('status', EcommerceOrderStatus.PRET_A_EXPEDIER)
        .whereNull('deliveryPersonId') // Seulement les commandes non assignées
        .preload('paymentMethod')
        .orderBy('createdAt', 'desc')

      // Récupérer les templates pour les images des moyens de paiement
      const templates = await PaymentMethodTemplate.query()
      const templatesMap = new Map(templates.map(t => [t.type, t]))

      // Formater les livraisons pour inclure le type de moyen de paiement avec image
      const formattedDeliveries = deliveries.map((order) => {
        const serialized = order.serialize()
        const paymentMethod = order.paymentMethod
          ? (() => {
              const template = templatesMap.get(order.paymentMethod.type)
              return {
                id: order.paymentMethod.id,
                type: order.paymentMethod.type,
                numeroCompte: order.paymentMethod.numeroCompte,
                nomTitulaire: order.paymentMethod.nomTitulaire,
                isDefault: order.paymentMethod.isDefault,
                isActive: order.paymentMethod.isActive,
                imageUrl: template?.imageUrl || null,
                name: template?.name || order.paymentMethod.type,
              }
            })()
          : null

        return {
          ...serialized,
          paymentMethod,
        }
      })

      return response.status(200).json({
        success: true,
        message: 'Livraisons disponibles récupérées avec succès',
        livraisons: formattedDeliveries,
      })
    } catch (error) {
      logger.error('Erreur récupération livraisons disponibles', {
        error: error.message,
        stack: error.stack,
      })

      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des livraisons disponibles',
      })
    }
  }

  /**
   * POST /ecommerce/livraison/:id/take
   * Prendre en charge une livraison (livreur)
   */
  async takeDelivery({ response, auth, params }: HttpContext) {
    try {
      const user = auth.user!
      const { id } = params

      if (user.role !== 'livreur') {
        return response.status(403).json({
          success: false,
          message: 'Seuls les livreurs peuvent prendre une livraison',
        })
      }

      const order = await EcommerceOrder.find(id)
      if (!order) {
        return response.status(404).json({
          success: false,
          message: 'Commande non trouvée',
        })
      }

      if (order.status !== EcommerceOrderStatus.PRET_A_EXPEDIER) {
        return response.status(400).json({
          success: false,
          message: 'Cette commande n\'est pas prête à être expédiée',
        })
      }

      if (order.deliveryPersonId && order.deliveryPersonId !== user.id) {
        return response.status(400).json({
          success: false,
          message: 'Cette commande est déjà assignée à un autre livreur',
        })
      }

      // Assigner le livreur et changer le statut à accepte_livreur
      order.deliveryPersonId = user.id
      order.status = EcommerceOrderStatus.ACCEPTE_LIVREUR
      await order.save()

      // Logger
      await EcommerceOrderLog.create({
        logId: randomUUID(),
        orderId: order.orderId,
        oldStatus: EcommerceOrderStatus.PRET_A_EXPEDIER,
        newStatus: EcommerceOrderStatus.ACCEPTE_LIVREUR,
        changedBy: user.id,
        changedByRole: user.role,
        reason: 'Livraison acceptée par le livreur',
      })

      // Recharger le moyen de paiement
      await order.load('paymentMethod')

      // Formater le moyen de paiement pour inclure le type
      const formattedPaymentMethod = order.paymentMethod
        ? {
            id: order.paymentMethod.id,
            type: order.paymentMethod.type,
            numeroCompte: order.paymentMethod.numeroCompte,
            nomTitulaire: order.paymentMethod.nomTitulaire,
            isDefault: order.paymentMethod.isDefault,
            isActive: order.paymentMethod.isActive,
          }
        : null

      const serializedOrder = order.serialize()
      const formattedOrder = {
        ...serializedOrder,
        paymentMethod: formattedPaymentMethod,
      }

      return response.status(200).json({
        success: true,
        order: formattedOrder,
        message: 'Livraison prise en charge avec succès',
      })
    } catch (error) {
      logger.error('Erreur prise en charge livraison', {
        error: error.message,
        stack: error.stack,
      })

      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la prise en charge de la livraison',
      })
    }
  }

  /**
   * Vérifier si une transition de statut est autorisée
   */
  private canTransitionStatus(
    currentStatus: EcommerceOrderStatus,
    newStatus: string,
    userRole: string,
    userId: number,
    order: EcommerceOrder
  ): { allowed: boolean; reason?: string } {
    // Status delivered est final
    if (currentStatus === EcommerceOrderStatus.DELIVERED) {
      return { allowed: false, reason: 'La commande est déjà livrée' }
    }

    // Règles par transition
    const transitions: Record<string, any> = {
      [EcommerceOrderStatus.PENDING_PAYMENT]: {
        [EcommerceOrderStatus.PENDING]: ['acheteur', 'vendeur'],
        [EcommerceOrderStatus.CANCELLED]: ['acheteur', 'vendeur'],
      },
      [EcommerceOrderStatus.PENDING]: {
        [EcommerceOrderStatus.EN_PREPARATION]: ['vendeur'],
        [EcommerceOrderStatus.CANCELLED]: ['acheteur', 'vendeur'],
        [EcommerceOrderStatus.REJECTED]: ['vendeur'],
      },
      [EcommerceOrderStatus.EN_PREPARATION]: {
        [EcommerceOrderStatus.PRET_A_EXPEDIER]: ['vendeur'],
        [EcommerceOrderStatus.CANCELLED]: ['acheteur', 'vendeur'],
      },
      [EcommerceOrderStatus.PRET_A_EXPEDIER]: {
        [EcommerceOrderStatus.ACCEPTE_LIVREUR]: ['livreur'],
        [EcommerceOrderStatus.CANCELLED]: ['acheteur', 'vendeur', 'livreur'],
      },
      [EcommerceOrderStatus.ACCEPTE_LIVREUR]: {
        [EcommerceOrderStatus.EN_ROUTE]: ['livreur'],
        [EcommerceOrderStatus.CANCELLED]: ['acheteur', 'vendeur', 'livreur'],
      },
      [EcommerceOrderStatus.EN_ROUTE]: {
        [EcommerceOrderStatus.DELIVERED]: ['livreur'],
        [EcommerceOrderStatus.CANCELLED]: ['livreur'],
      },
    }

    const allowedTransition = transitions[currentStatus]?.[newStatus]
    if (!allowedTransition) {
      return {
        allowed: false,
        reason: `Transition de "${currentStatus}" vers "${newStatus}" non autorisée`,
      }
    }

    if (!allowedTransition.includes(userRole)) {
      return {
        allowed: false,
        reason: `Votre rôle (${userRole}) ne permet pas cette action`,
      }
    }

    // Vérifications supplémentaires
    if (userRole === 'vendeur' && order.vendorId !== userId) {
      return { allowed: false, reason: 'Vous n\'êtes pas le vendeur de cette commande' }
    }

    if (userRole === 'acheteur' && order.clientId !== userId) {
      return { allowed: false, reason: 'Vous n\'êtes pas le client de cette commande' }
    }

    return { allowed: true }
  }

  /**
   * POST /ecommerce/commandes/initialize
   * Initialiser une commande multi-vendeurs avec calcul automatique des frais de livraison
   */
  async initialize({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user!
      const payload = await request.validateUsing(initializeOrderValidator)

      // Récupérer tous les produits demandés avec leurs images
      const productIds = payload.products.map(p => p.productId)
      const products = await Product.query().whereIn('id', productIds)

      // Charger les images de tous les produits
      const allMedias = await Media.query()
        .whereIn('product_id', productIds)
        .orderBy('created_at', 'asc')
      
      // Créer un Map pour les images par produit
      const mediasByProduct = new Map<number, typeof allMedias>()
      for (const media of allMedias) {
        if (!mediasByProduct.has(media.productId)) {
          mediasByProduct.set(media.productId, [])
        }
        mediasByProduct.get(media.productId)!.push(media)
      }

      if (products.length !== productIds.length) {
        return response.status(404).json({
          success: false,
          message: 'Un ou plusieurs produits n\'existent pas',
        })
      }

      // Créer un Map pour accès rapide aux quantités
      const quantityMap = new Map(payload.products.map(p => [p.productId, p.quantite]))

      // Grouper les produits par vendeur
      const productsByVendor = new Map<number, Array<{
        product: typeof products[0],
        quantite: number
      }>>()

      for (const product of products) {
        const vendorId = product.vendeurId
        const quantite = quantityMap.get(product.id)!

        if (!productsByVendor.has(vendorId)) {
          productsByVendor.set(vendorId, [])
        }
        productsByVendor.get(vendorId)!.push({ product, quantite })
      }

      // Récupérer les vendeurs avec leur position GPS
      const vendorIds = Array.from(productsByVendor.keys())
      const vendors = await User.query().whereIn('id', vendorIds)

      // Créer un Map des vendeurs
      const vendorMap = new Map(vendors.map(v => [v.id, v]))

      // Créer les sous-commandes
      const createdOrders = []

      for (const [vendorId, vendorProducts] of productsByVendor) {
        const vendor = vendorMap.get(vendorId)
        
        if (!vendor) {
          logger.warn(`Vendeur ${vendorId} non trouvé`)
          continue
        }

        // Vérifier que le vendeur a une position GPS
        if (!vendor.latitude || !vendor.longitude) {
          return response.status(400).json({
            success: false,
            message: `Le vendeur ${vendor.firstName} ${vendor.lastName} n'a pas de position GPS enregistrée`,
          })
        }

        // Calculer la distance entre le client et le vendeur
        const distance = DistanceCalculator.calculateDistance(
          { latitude: payload.latitude, longitude: payload.longitude },
          { latitude: vendor.latitude, longitude: vendor.longitude }
        )

        // Calculer les frais de livraison
        const deliveryFee = DistanceCalculator.calculateDeliveryFee(distance)

        // Calculer le total des produits
        const totalProduits = vendorProducts.reduce(
          (sum, { product, quantite }) => sum + product.price * quantite,
          0
        )

        // Créer la sous-commande (paymentMethodId à null, l'acheteur choisira après)
        const order = await EcommerceOrder.create({
          orderId: randomUUID(),
          status: EcommerceOrderStatus.PENDING_PAYMENT,
          clientId: user.id,
          client: (user as any).fullName || user.email,
          phone: (user as any).phone || '',
          vendorId: vendorId,
          deliveryPersonId: null,
          items: vendorProducts.map(({ product, quantite }) => ({
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: quantite,
            idVendeur: vendorId,
          })),
          address: {
            ville: payload.address?.ville || '',
            commune: payload.address?.commune || '',
            quartier: payload.address?.quartier || '',
            avenue: payload.address?.avenue || '',
            numero: payload.address?.numero || '',
            pays: payload.address?.pays || '',
            codePostale: payload.address?.codePostale || '',
            refAdresse: payload.address?.refAdresse || '',
          },
          total: totalProduits,
          latitude: payload.latitude,
          longitude: payload.longitude,
          distanceKm: distance,
          deliveryFee: deliveryFee,
          packagePhoto: null,
          packagePhotoPublicId: null,
          paymentMethodId: null,
        })

        // Logger la création
        await EcommerceOrderLog.create({
          logId: randomUUID(),
          orderId: order.orderId,
          oldStatus: '',
          newStatus: EcommerceOrderStatus.PENDING_PAYMENT,
          changedBy: user.id,
          changedByRole: user.role,
          reason: 'Initialisation de la commande',
        })

        // Charger le moyen de paiement avec son template (si existe)
        let paymentMethodData = null
        if (order.paymentMethodId) {
          await order.load('paymentMethod')
          await order.refresh()
          const template = await PaymentMethodTemplate.query()
            .where('type', order.paymentMethod!.type)
            .first()
          paymentMethodData = {
            id: order.paymentMethod!.id,
            type: order.paymentMethod!.type,
            name: template?.name || order.paymentMethod!.type,
            imageUrl: template?.imageUrl || null,
            numeroCompte: order.paymentMethod!.numeroCompte,
          }
        }

        createdOrders.push({
          id: order.id,
          orderId: order.orderId,
          vendeurId: vendorId,
          vendeur: {
            id: vendor.id,
            firstName: vendor.firstName,
            lastName: vendor.lastName,
          },
          products: vendorProducts.map(({ product, quantite }) => {
            const productMedias = mediasByProduct.get(product.id) || []
            const mainImage = productMedias.length > 0 ? productMedias[0].mediaUrl : null
            const secondaryImages = productMedias.length > 1 
              ? productMedias.slice(1).map(m => m.mediaUrl) 
              : []
            
            return {
              id: product.id,
              name: product.name,
              prix: product.price,
              quantite: quantite,
              imageUrl: mainImage,
              images: secondaryImages,
            }
          }),
          totalProduits: totalProduits,
          deliveryFee: order.deliveryFee!,
          distanceKm: order.distanceKm!,
          totalAvecLivraison: totalProduits + order.deliveryFee!,
          status: order.status,
          address: order.address,
          latitude: order.latitude,
          longitude: order.longitude,
          paymentMethod: paymentMethodData,
          createdAt: order.createdAt,
        })
      }

      // Calculer le résumé global
      const summary = {
        totalOrders: createdOrders.length,
        totalProducts: createdOrders.reduce((sum, o) => sum + o.totalProduits, 0),
        totalDelivery: createdOrders.reduce((sum, o) => sum + o.deliveryFee, 0),
        grandTotal: createdOrders.reduce((sum, o) => sum + o.totalAvecLivraison, 0),
      }

      // Enregistrer la localisation de l'acheteur dans Firebase
      if (createdOrders.length > 0) {
        await saveLocationToFirestore({
          orderId: createdOrders[0].orderId,
          userId: String(user.id),
          role: user.role,
          latitude: payload.latitude,
          longitude: payload.longitude,
          phone: user.phone || '',
        })
      }

      return response.status(201).json({
        success: true,
        message: 'Commandes initialisées avec succès',
        orders: createdOrders,
        summary: summary,
      })

    } catch (error) {
      logger.error('Erreur lors de l\'initialisation des commandes:', error)
      return response.status(500).json({
        success: false,
        message: 'Erreur lors de l\'initialisation des commandes',
        error: error.message,
      })
    }
  }

  /**
   * POST /ecommerce/location/livreur
   * Enregistrer la localisation du livreur dans Firebase
   */
  async saveDeliveryLocation({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user!
      const { orderId, latitude, longitude } = request.only(['orderId', 'latitude', 'longitude'])

      if (!latitude || !longitude) {
        return response.status(400).json({
          success: false,
          message: 'Latitude et longitude sont requis',
        })
      }

      await saveLocationToFirestore({
        orderId: orderId || '',
        userId: String(user.id),
        role: user.role,
        latitude: Number(latitude),
        longitude: Number(longitude),
        phone: user.phone || '',
      })

      return response.status(200).json({
        success: true,
        message: 'Localisation enregistrée avec succès',
      })
    } catch (error) {
      logger.error('Erreur enregistrement localisation livreur:', error)
      return response.status(500).json({
        success: false,
        message: 'Erreur lors de l\'enregistrement de la localisation',
      })
    }
  }

  /**
   * GET /ecommerce/commandes/buyer/me
   * Récupérer toutes les commandes de l'acheteur connecté
   */
  async getBuyerOrders({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user!
      const { status, vendeurId } = request.qs()

      // Trouver la date de création de la commande pending_payment la plus récente
      const latestOrder = await EcommerceOrder.query()
        .where('client_id', user.id)
        .where('status', EcommerceOrderStatus.PENDING_PAYMENT)
        .orderBy('created_at', 'desc')
        .first()

      if (!latestOrder) {
        return response.status(200).json({
          success: true,
          message: 'Aucune commande trouvée',
          orders: [],
          stats: {
            total: 0,
            pending_payment: 0,
            pending: 0,
            in_preparation: 0,
            ready_to_ship: 0,
            in_delivery: 0,
            delivered: 0,
            cancelled: 0,
            rejected: 0,
          }
        })
      }

      // Récupérer uniquement les commandes pending_payment de l'utilisateur
      const allOrders = await EcommerceOrder.query()
        .where('client_id', user.id)
        .where('status', EcommerceOrderStatus.PENDING_PAYMENT)
        .preload('paymentMethod')
        .orderBy('created_at', 'desc')

      // Filtrer pour ne garder que les commandes créées dans les 10 secondes autour de la plus récente
      const latestMs = latestOrder.createdAt.toMillis()
      const tenSecondsAgo = latestMs - 10000
      const tenSecondsAfter = latestMs + 10000

      let orders = allOrders.filter((order) => {
        const orderMs = order.createdAt.toMillis()
        return orderMs >= tenSecondsAgo && orderMs <= tenSecondsAfter
      })

      // Filtrer par status si fourni
      const filteredOrders = status
        ? orders.filter(o => o.status === status)
        : orders

      // Filtrer par vendeur si fourni
      const finalOrders = vendeurId
        ? filteredOrders.filter(o => o.vendorId === Number(vendeurId))
        : filteredOrders

      // Enrichir avec les templates et les infos vendeur
      const enrichedOrders = await Promise.all(finalOrders.map(async (order) => {
        // Récupérer le vendeur
        const vendor = await User.find(order.vendorId)

        // Récupérer le template du moyen de paiement
        let formattedPaymentMethod = null
        if (order.paymentMethod) {
          const template = await PaymentMethodTemplate.query()
            .where('type', order.paymentMethod.type)
            .first()

          formattedPaymentMethod = {
            id: order.paymentMethod.id,
            type: order.paymentMethod.type,
            name: template?.name || order.paymentMethod.type,
            imageUrl: template?.imageUrl || null,
            numeroCompte: order.paymentMethod.numeroCompte,
            nomTitulaire: order.paymentMethod.nomTitulaire,
            isDefault: order.paymentMethod.isDefault,
            isActive: order.paymentMethod.isActive,
          }
        }

        return {
          id: order.id,
          orderId: order.orderId,
          status: order.status,
          vendeurId: order.vendorId,
          vendeur: vendor ? {
            id: vendor.id,
            firstName: vendor.firstName,
            lastName: vendor.lastName,
            phone: vendor.phone,
          } : null,
          products: order.items,
          total: order.total,
          deliveryFee: order.deliveryFee,
          distanceKm: order.distanceKm,
          totalAvecLivraison: order.deliveryFee ? Number(order.total) + order.deliveryFee : Number(order.total),
          address: order.address,
          latitude: order.latitude,
          longitude: order.longitude,
          paymentMethod: formattedPaymentMethod,
          deliveryPersonId: order.deliveryPersonId,
          codeColis: order.codeColis,
          packagePhoto: order.packagePhoto,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        }
      }))

      // Calculer les statistiques (basées sur les commandes de la dernière session)
      const stats = {
        total: finalOrders.length,
        pending_payment: finalOrders.filter(o => o.status === EcommerceOrderStatus.PENDING_PAYMENT).length,
        pending: finalOrders.filter(o => o.status === EcommerceOrderStatus.PENDING).length,
        in_preparation: finalOrders.filter(o => o.status === EcommerceOrderStatus.EN_PREPARATION).length,
        ready_to_ship: finalOrders.filter(o => o.status === EcommerceOrderStatus.PRET_A_EXPEDIER).length,
        in_delivery: finalOrders.filter(o => o.status === EcommerceOrderStatus.EN_ROUTE).length,
        delivered: finalOrders.filter(o => o.status === EcommerceOrderStatus.DELIVERED).length,
        cancelled: finalOrders.filter(o => o.status === EcommerceOrderStatus.CANCELLED).length,
        rejected: finalOrders.filter(o => o.status === EcommerceOrderStatus.REJECTED).length,
      }

      return response.status(200).json({
        success: true,
        message: 'Vos commandes récupérées avec succès',
        orders: enrichedOrders,
        stats: stats,
      })

    } catch (error) {
      logger.error('Erreur lors de la récupération des commandes de l\'acheteur:', error)
      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de vos commandes',
        error: error.message,
      })
    }
  }

  /**
   * PATCH /ecommerce/commandes/:id/payment-method
   * Modifier le moyen de paiement d'une commande (uniquement si status = pending_payment)
   */
  async updatePaymentMethod({ request, response, auth, params }: HttpContext) {
    try {
      const user = auth.user!
      const orderId = params.id
      const payload = await request.validateUsing(updatePaymentMethodValidator)

      // Récupérer la commande
      const order = await EcommerceOrder.find(orderId)

      if (!order) {
        return response.status(404).json({
          success: false,
          message: 'Commande non trouvée',
        })
      }

      // Vérifier que c'est bien le client propriétaire
      if (order.clientId !== user.id) {
        return response.status(403).json({
          success: false,
          message: 'Vous n\'êtes pas autorisé à modifier cette commande',
        })
      }

      // Récupérer le nouveau moyen de paiement
      const newPaymentMethod = await PaymentMethod.find(payload.paymentMethodId)

      if (!newPaymentMethod) {
        return response.status(404).json({
          success: false,
          message: 'Moyen de paiement non trouvé',
        })
      }

      // Vérifier que le moyen de paiement appartient au vendeur de la commande
      if (newPaymentMethod.vendeurId !== order.vendorId) {
        return response.status(403).json({
          success: false,
          message: 'Le moyen de paiement sélectionné n\'appartient pas au vendeur de cette commande',
        })
      }

      // Vérifier que le moyen de paiement est actif
      if (!newPaymentMethod.isActive) {
        return response.status(400).json({
          success: false,
          message: 'Le moyen de paiement sélectionné n\'est pas actif',
        })
      }

      // Sauvegarder l'ancien statut et payment method ID pour détecter le premier ajout
      const oldStatus = order.status
      const oldPaymentMethodId = order.paymentMethodId

      // Mettre à jour le moyen de paiement
      order.paymentMethodId = newPaymentMethod.id
      
      // Sauvegarder le numéro de paiement si fourni
      if (payload.numeroPayment) {
        order.numeroPayment = payload.numeroPayment
      }
      
      // LOGIQUE SPÉCIALE : Si c'est le premier ajout de payment method, passer automatiquement à pending
      let firebaseOrderId: string | null = null
      if (oldStatus === EcommerceOrderStatus.PENDING_PAYMENT && oldPaymentMethodId === null) {
        order.status = EcommerceOrderStatus.PENDING
        
        // Logger le changement de statut
        await EcommerceOrderLog.create({
          logId: randomUUID(),
          orderId: order.orderId,
          oldStatus: EcommerceOrderStatus.PENDING_PAYMENT,
          newStatus: EcommerceOrderStatus.PENDING,
          changedBy: user.id,
          changedByRole: user.role,
          reason: 'Moyen de paiement confirmé',
        })
        
        await order.save()
        
        // Charger les relations nécessaires
        await order.load('clientUser')
        
        // Récupérer les infos des produits pour les items
        const enrichedItems = await Promise.all(
          order.items.map(async (item: any) => {
            const product = await Product.query()
              .where('id', item.productId)
              .preload('media')
              .preload('category')
              .first()
            
            return {
              id: item.productId,
              name: item.name,
              category: product?.category?.name || 'Non catégorisé',
              price: Number(item.price),
              imagePath: product?.media?.mediaUrl || '',
              quantity: item.quantity,
              stock: product?.stock || 0,
              idVendeur: String(item.idVendeur),
              description: product?.description || null,
            }
          })
        )
        
        // Formater l'adresse complète
        const addr = order.address
        const adresseComplete = `${addr.avenue}, ${addr.numero}, ${addr.quartier}, ${addr.ville}, ${addr.pays}`
        
        // Enregistrer dans Firestore (backup + notifications)
        const cartOrder = {
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          status: 'pending' as const,
          phone: order.phone,
          client: order.client,
          idClient: String(order.clientId),
          adresse: adresseComplete,
          ville: addr.ville || '',
          commune: addr.commune || '',
          quartier: addr.quartier || '',
          avenue: addr.avenue || '',
          numero: addr.numero || '',
          pays: addr.pays || '',
          longitude: order.longitude || 0,
          latitude: order.latitude || 0,
          total: Number(order.total),
          items: enrichedItems,
        }
        
        firebaseOrderId = await saveOrderToFirestore(cartOrder)
        
        // Stocker la référence Firebase dans PostgreSQL
        order.firebaseOrderId = firebaseOrderId
        await order.save()
        
        // Envoyer les notifications push aux vendeurs
        await notifyVendors(enrichedItems, order.client, firebaseOrderId)
      } else {
        await order.save()
      }

      // Charger le moyen de paiement avec son template
      await order.load('paymentMethod')
      const template = await PaymentMethodTemplate.query()
        .where('type', order.paymentMethod!.type)
        .first()

      return response.status(200).json({
        success: true,
        message: firebaseOrderId ? 'Commande créée et notification envoyée' : 'Moyen de paiement mis à jour avec succès',
        orderId: firebaseOrderId,
        order: {
          id: order.id,
          orderId: order.orderId,
          vendeurId: order.vendorId,
          totalAvecLivraison: order.deliveryFee ? order.total + order.deliveryFee : order.total,
          status: order.status,
          paymentMethod: {
            id: order.paymentMethod!.id,
            type: order.paymentMethod!.type,
            name: template?.name || order.paymentMethod!.type,
            imageUrl: template?.imageUrl || null,
            numeroCompte: order.paymentMethod!.numeroCompte,
          },
          updatedAt: order.updatedAt,
        },
      })

    } catch (error) {
      logger.error('Erreur lors de la modification du moyen de paiement:', error)
      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la modification du moyen de paiement',
        error: error.message,
      })
    }
  }

  /**
   * PATCH /ecommerce/commandes/batch-update-payment-methods
   * Modifier les moyens de paiement de plusieurs commandes en une seule requête
   */
  async batchUpdatePaymentMethods({ request, response, auth }: HttpContext) {
    const trx = await db.transaction()
    
    try {
      const user = auth.user!
      const payload = await request.validateUsing(batchUpdatePaymentMethodsValidator)

      const commandeIds = payload.updates.map(u => u.commandeId)
      
      // Récupérer toutes les commandes
      const orders = await EcommerceOrder.query()
        .whereIn('id', commandeIds)
        .where('client_id', user.id)
        .useTransaction(trx)

      // Vérifier que toutes les commandes existent et appartiennent à l'utilisateur
      if (orders.length !== commandeIds.length) {
        await trx.rollback()
        return response.status(404).json({
          success: false,
          message: 'Une ou plusieurs commandes n\'existent pas ou ne vous appartiennent pas',
        })
      }

      // Vérifier que toutes les commandes sont en PENDING_PAYMENT
      const notPendingOrders = orders.filter(o => o.status !== EcommerceOrderStatus.PENDING_PAYMENT)
      if (notPendingOrders.length > 0) {
        await trx.rollback()
        return response.status(400).json({
          success: false,
          message: 'Certaines commandes ne sont plus modifiables (statut différent de pending_payment)',
          orderIds: notPendingOrders.map(o => o.id),
        })
      }

      // Créer un map pour accès rapide
      const orderMap = new Map(orders.map(o => [o.id, o]))
      const paymentMethodIds = payload.updates.map(u => u.paymentMethodId)

      // Récupérer tous les moyens de paiement
      const paymentMethods = await PaymentMethod.query()
        .whereIn('id', paymentMethodIds)
        .useTransaction(trx)

      const paymentMethodMap = new Map(paymentMethods.map(pm => [pm.id, pm]))

      // Valider et mettre à jour chaque commande
      const updatedOrders = []
      
      for (const update of payload.updates) {
        const order = orderMap.get(update.commandeId)!
        const paymentMethod = paymentMethodMap.get(update.paymentMethodId)

        if (!paymentMethod) {
          await trx.rollback()
          return response.status(404).json({
            success: false,
            message: `Le moyen de paiement ${update.paymentMethodId} n'existe pas`,
            commandeId: update.commandeId,
          })
        }

        // Vérifier que le moyen de paiement appartient au vendeur
        if (paymentMethod.vendeurId !== order.vendorId) {
          await trx.rollback()
          return response.status(403).json({
            success: false,
            message: `Le moyen de paiement ${update.paymentMethodId} n'appartient pas au vendeur de la commande ${update.commandeId}`,
          })
        }

        // Vérifier que le moyen de paiement est actif
        if (!paymentMethod.isActive) {
          await trx.rollback()
          return response.status(400).json({
            success: false,
            message: `Le moyen de paiement ${update.paymentMethodId} n'est pas actif`,
            commandeId: update.commandeId,
          })
        }

        // Mettre à jour le moyen de paiement
        order.paymentMethodId = paymentMethod.id
        
        // Sauvegarder le numéro de paiement si fourni
        if (update.numeroPayment) {
          order.numeroPayment = update.numeroPayment
        }
        
        // Si la commande est en pending_payment, passer automatiquement à pending (paiement confirmé)
        if (order.status === EcommerceOrderStatus.PENDING_PAYMENT) {
          order.status = EcommerceOrderStatus.PENDING
          
          // Logger le changement de statut
          await EcommerceOrderLog.create({
            logId: randomUUID(),
            orderId: order.orderId,
            oldStatus: EcommerceOrderStatus.PENDING_PAYMENT,
            newStatus: EcommerceOrderStatus.PENDING,
            changedBy: user.id,
            changedByRole: user.role,
            reason: 'Moyen de paiement confirmé (batch)',
          }, { client: trx })
        }
        
        await order.useTransaction(trx).save()
        
        updatedOrders.push({
          commandeId: order.id,
          orderId: order.orderId,
          vendeurId: order.vendorId,
          oldPaymentMethodId: order.paymentMethodId,
          newPaymentMethodId: paymentMethod.id,
        })
      }

      await trx.commit()

      // Enregistrer dans Firestore et envoyer les notifications pour les commandes passées en pending
      const firebaseOrderIds: { commandeId: number; firebaseOrderId: string }[] = []
      
      for (const order of orders) {
        if (order.status === EcommerceOrderStatus.PENDING) {
          // Charger les relations nécessaires
          await order.load('clientUser')
          
          // Récupérer les infos des produits pour les items
          const enrichedItems = await Promise.all(
            order.items.map(async (item: any) => {
              const product = await Product.query()
                .where('id', item.productId)
                .preload('media')
                .preload('category')
                .first()
              
              return {
                id: item.productId,
                name: item.name,
                category: product?.category?.name || 'Non catégorisé',
                price: Number(item.price),
                imagePath: product?.media?.mediaUrl || '',
                quantity: item.quantity,
                stock: product?.stock || 0,
                idVendeur: String(item.idVendeur),
                description: product?.description || null,
              }
            })
          )
          
          // Formater l'adresse complète
          const addr = order.address
          const adresseComplete = `${addr.avenue}, ${addr.numero}, ${addr.quartier}, ${addr.ville}, ${addr.pays}`
          
          // Enregistrer dans Firestore (backup + notifications)
          const cartOrder = {
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            status: 'pending' as const,
            phone: order.phone,
            client: order.client,
            idClient: String(order.clientId),
            adresse: adresseComplete,
            ville: addr.ville || '',
            commune: addr.commune || '',
            quartier: addr.quartier || '',
            avenue: addr.avenue || '',
            numero: addr.numero || '',
            pays: addr.pays || '',
            longitude: order.longitude || 0,
            latitude: order.latitude || 0,
            total: Number(order.total),
            items: enrichedItems,
          }
          
          const firebaseOrderId = await saveOrderToFirestore(cartOrder)
          firebaseOrderIds.push({ commandeId: order.id, firebaseOrderId })
          
          // Stocker la référence Firebase dans PostgreSQL
          order.firebaseOrderId = firebaseOrderId
          await order.save()
          
          // Envoyer les notifications push aux vendeurs
          await notifyVendors(enrichedItems, order.client, firebaseOrderId)
        }
      }

      // Charger les commandes mises à jour avec leurs relations
      const finalOrders = await EcommerceOrder.query()
        .whereIn('id', commandeIds)
        .preload('paymentMethod')

      // Enrichir avec les templates
      const enrichedOrders = await Promise.all(finalOrders.map(async (order) => {
        const template = await PaymentMethodTemplate.query()
          .where('type', order.paymentMethod!.type)
          .first()

        const firebaseInfo = firebaseOrderIds.find(f => f.commandeId === order.id)

        return {
          id: order.id,
          orderId: order.orderId,
          vendeurId: order.vendorId,
          status: order.status,
          total: order.total,
          deliveryFee: order.deliveryFee,
          totalAvecLivraison: order.deliveryFee ? Number(order.total) + order.deliveryFee : Number(order.total),
          firebaseOrderId: firebaseInfo?.firebaseOrderId || null,
          paymentMethod: {
            id: order.paymentMethod!.id,
            type: order.paymentMethod!.type,
            name: template?.name || order.paymentMethod!.type,
            imageUrl: template?.imageUrl || null,
            numeroCompte: order.paymentMethod!.numeroCompte,
          },
          updatedAt: order.updatedAt,
        }
      }))

      return response.status(200).json({
        success: true,
        message: firebaseOrderIds.length > 0 
          ? `${updatedOrders.length} commande(s) mise(s) à jour et ${firebaseOrderIds.length} notification(s) envoyée(s)`
          : `${updatedOrders.length} commande(s) mise(s) à jour avec succès`,
        orders: enrichedOrders,
        summary: {
          totalUpdated: updatedOrders.length,
          firebaseOrders: firebaseOrderIds,
          updates: updatedOrders,
        },
      })

    } catch (error) {
      await trx.rollback()
      logger.error('Erreur lors de la modification batch des moyens de paiement:', error)
      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la modification des moyens de paiement',
        error: error.message,
      })
    }
  }

  /**
   * POST /ecommerce/commandes/:id/upload-package-photo
   * Uploader la photo du colis et générer un code unique à 4 chiffres
   */
  async uploadPackagePhoto({ request, response, params, auth }: HttpContext) {
    try {
      const user = auth.user!
      const { id } = params

      // Vérifier que la commande existe
      const order = await EcommerceOrder.find(id)
      if (!order) {
        return response.status(404).json({
          success: false,
          message: 'Commande non trouvée',
        })
      }

      // Vérifier que l'utilisateur est le vendeur de cette commande
      if (order.vendorId !== user.id) {
        return response.status(403).json({
          success: false,
          message: 'Seul le vendeur de cette commande peut uploader la photo du colis',
        })
      }

      // Vérifier que le statut est EN_PREPARATION
      if (order.status !== EcommerceOrderStatus.EN_PREPARATION) {
        return response.status(400).json({
          success: false,
          message: 'La photo du colis ne peut être uploadée que lorsque la commande est en préparation',
        })
      }

      // Récupérer le fichier uploadé
      const packagePhoto = request.file('packagePhoto', {
        size: '20mb',
        extnames: ['jpg', 'jpeg', 'png', 'webp'],
      })

      if (!packagePhoto) {
        return response.status(400).json({
          success: false,
          message: 'Aucune photo fournie. Le champ doit être nommé "packagePhoto"',
        })
      }

      // Valider le fichier
      if (!packagePhoto.isValid || !packagePhoto.tmpPath) {
        logger.error('Fichier invalide lors de l\'upload', {
          isValid: packagePhoto.isValid,
          tmpPath: packagePhoto.tmpPath,
          errors: packagePhoto.errors,
        })
        return response.status(400).json({
          success: false,
          message: 'Fichier invalide',
          errors: packagePhoto.errors,
        })
      }

      // Vérifier que le fichier temporaire existe
      const fs = await import('fs/promises')
      try {
        await fs.access(packagePhoto.tmpPath)
      } catch (error) {
        logger.error('Fichier temporaire non accessible', {
          tmpPath: packagePhoto.tmpPath,
          error: error.message,
        })
        return response.status(500).json({
          success: false,
          message: 'Erreur: fichier temporaire non accessible',
          error: error.message,
        })
      }

      // Supprimer l'ancienne photo si elle existe
      if (order.packagePhotoPublicId) {
        try {
          await ecommerceCloudinaryService.deletePhoto(order.packagePhotoPublicId)
        } catch (error) {
          logger.warn('Erreur lors de la suppression de l\'ancienne photo du colis:', error)
        }
      }

      // Uploader la nouvelle photo sur Cloudinary
      let uploadResult
      try {
        uploadResult = await ecommerceCloudinaryService.uploadPackagePhoto(
          packagePhoto.tmpPath,
          order.orderId
        )
      } catch (error) {
        logger.error('Erreur lors de l\'upload Cloudinary', {
          tmpPath: packagePhoto.tmpPath,
          orderId: order.orderId,
          error: error.message,
          stack: error.stack,
        })
        return response.status(500).json({
          success: false,
          message: 'Erreur lors de l\'upload de la photo sur Cloudinary',
          error: error.message,
        })
      }

      // Générer un code unique à 4 chiffres
      let codeColis: string
      let isUnique = false
      let attempts = 0
      const maxAttempts = 100

      while (!isUnique && attempts < maxAttempts) {
        // Générer un code aléatoire de 4 chiffres (0000-9999)
        codeColis = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
        
        // Vérifier l'unicité
        const existingOrder = await EcommerceOrder.query()
          .where('code_colis', codeColis)
          .where('id', '!=', order.id)
          .first()

        if (!existingOrder) {
          isUnique = true
        }
        attempts++
      }

      if (!isUnique) {
        return response.status(500).json({
          success: false,
          message: 'Impossible de générer un code unique. Veuillez réessayer.',
        })
      }

      // Sauvegarder les informations
      order.packagePhoto = uploadResult.url
      order.packagePhotoPublicId = uploadResult.publicId
      order.codeColis = codeColis!
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
      logger.error('Erreur lors de l\'upload de la photo du colis:', error)
      return response.status(500).json({
        success: false,
        message: 'Erreur lors de l\'upload de la photo',
        error: error.message,
      })
    }
  }

  /**
   * GET /ecommerce/commandes/admin/all
   * Récupérer toutes les commandes du système avec pagination (admin uniquement)
   */
  async getAllOrders({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user!

      // Vérifier que l'utilisateur est admin ou superadmin
      if (user.role !== UserRole.ADMIN && user.role !== UserRole.SuperAdmin) {
        return response.forbidden({
          success: false,
          message: 'Seuls les administrateurs peuvent consulter toutes les commandes',
        })
      }

      // Récupérer les paramètres de pagination
      const page = request.input('page', 1)
      const limit = request.input('limit', 20)
      const status = request.input('status') // Optionnel: filtrer par statut
      const vendorId = request.input('vendor_id') // Optionnel: filtrer par vendeur
      const clientId = request.input('client_id') // Optionnel: filtrer par client

      // Construire la requête
      let query = EcommerceOrder.query()
        .preload('paymentMethod')
        .orderBy('createdAt', 'desc')

      // Appliquer les filtres optionnels
      if (status) {
        query = query.where('status', status)
      }
      if (vendorId) {
        query = query.where('vendor_id', vendorId)
      }
      if (clientId) {
        query = query.where('client_id', clientId)
      }

      // Pagination
      const orders = await query.paginate(page, limit)

      // Récupérer tous les templates pour les images
      const templates = await PaymentMethodTemplate.query()
      const templatesMap = new Map(templates.map(t => [t.type, t]))

      // Formater les commandes pour inclure le type de moyen de paiement avec image
      const formattedOrders = orders.all().map((order) => {
        const serialized = order.serialize()
        const paymentMethod = order.paymentMethod
          ? (() => {
              const template = templatesMap.get(order.paymentMethod.type)
              return {
                id: order.paymentMethod.id,
                type: order.paymentMethod.type,
                numeroCompte: order.paymentMethod.numeroCompte,
                nomTitulaire: order.paymentMethod.nomTitulaire,
                isDefault: order.paymentMethod.isDefault,
                isActive: order.paymentMethod.isActive,
                imageUrl: template?.imageUrl || null,
                name: template?.name || order.paymentMethod.type,
              }
            })()
          : null

        return {
          ...serialized,
          paymentMethod,
        }
      })

      return response.status(200).json({
        success: true,
        message: 'Commandes récupérées avec succès',
        data: formattedOrders,
        meta: {
          total: orders.total,
          perPage: orders.perPage,
          currentPage: orders.currentPage,
          lastPage: orders.lastPage,
          firstPage: orders.firstPage,
          hasMorePages: orders.hasMorePages,
        },
      })
    } catch (error) {
      logger.error('Erreur récupération toutes les commandes (admin)', {
        error: error.message,
        stack: error.stack,
      })
      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des commandes',
        error: error.message,
      })
    }
  }
}

