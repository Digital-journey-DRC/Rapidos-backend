import type { HttpContext } from '@adonisjs/core/http'
import CommandeExpress, { CommandeExpressStatus } from '#models/commande_express'
import Product from '#models/product'
import User from '#models/user'
import {
  createCommandeExpressValidator,
  updateCommandeExpressStatusValidator,
  assignDeliveryPersonValidator,
  cancelCommandeExpressVendeurValidator,
} from '#validators/commande_express'
import { randomUUID } from 'node:crypto'
import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'
import { saveCommandeExpressToFirestore } from '#services/firebase_service'
import admin from 'firebase-admin'
import ecommerceCloudinaryService from '#services/ecommerce_cloudinary_service'

export default class CommandeExpressController {
  /**
   * GET /commande-express/create-table
   * Endpoint temporaire pour créer la table commande_express
   */
  async createTable({ response }: HttpContext) {
    try {
      await db.rawQuery(`
        CREATE TABLE IF NOT EXISTS commande_express (
          id SERIAL PRIMARY KEY,
          order_id VARCHAR(255) NOT NULL UNIQUE,
          client_id INTEGER NOT NULL,
          client_name VARCHAR(255) NOT NULL,
          client_phone VARCHAR(50) NOT NULL,
          vendor_id INTEGER NOT NULL,
          package_value DECIMAL(10, 2) NOT NULL,
          package_description TEXT NOT NULL,
          pickup_address TEXT NOT NULL,
          delivery_address TEXT NOT NULL,
          pickup_reference VARCHAR(255),
          delivery_reference VARCHAR(255),
          created_by INTEGER NOT NULL,
          statut VARCHAR(50) NOT NULL DEFAULT 'pending',
          items JSONB NOT NULL,
          delivery_person_id INTEGER,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_commande_express_order_id ON commande_express(order_id);
        CREATE INDEX IF NOT EXISTS idx_commande_express_client_id ON commande_express(client_id);
        CREATE INDEX IF NOT EXISTS idx_commande_express_vendor_id ON commande_express(vendor_id);
        CREATE INDEX IF NOT EXISTS idx_commande_express_statut ON commande_express(statut);
        CREATE INDEX IF NOT EXISTS idx_commande_express_delivery_person_id ON commande_express(delivery_person_id);
        CREATE INDEX IF NOT EXISTS idx_commande_express_created_by ON commande_express(created_by);
      `)

      logger.info('Table commande_express créée avec succès')

      return response.status(200).json({
        success: true,
        message: 'Table commande_express créée avec succès',
      })
    } catch (error) {
      logger.error('Erreur création table commande_express', {
        error: error.message,
      })

      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la table',
        error: error.message,
      })
    }
  }

  /**
   * GET /commande-express/add-vendor-column
   * Endpoint temporaire pour ajouter la colonne vendor_id
   */
  async addVendorColumn({ response }: HttpContext) {
    try {
      await db.rawQuery(`
        ALTER TABLE commande_express 
        ADD COLUMN IF NOT EXISTS vendor_id INTEGER NOT NULL DEFAULT 1;
        
        CREATE INDEX IF NOT EXISTS idx_commande_express_vendor_id ON commande_express(vendor_id);
      `)

      logger.info('Colonne vendor_id ajoutée avec succès')

      return response.status(200).json({
        success: true,
        message: 'Colonne vendor_id ajoutée avec succès',
      })
    } catch (error) {
      logger.error('Erreur ajout colonne vendor_id', {
        error: error.message,
      })

      return response.status(500).json({
        success: false,
        message: 'Erreur lors de l\'ajout de la colonne',
        error: error.message,
      })
    }
  }

  /**
   * POST /commande-express/create
   * Créer une nouvelle commande express avec déduction automatique du stock (si productId fourni)
   */
  async create({ request, response }: HttpContext) {
    const trx = await db.transaction()

    try {
      // Si form-data, items arrive en string JSON — on le parse avant validation
      const rawItems = request.input('items')
      if (typeof rawItems === 'string') {
        try {
          const allFields = request.all()
          allFields.items = JSON.parse(rawItems)
          request.updateBody(allFields)
        } catch {
          await trx.rollback()
          return response.status(400).json({
            success: false,
            message: 'Le champ items doit être un JSON valide',
          })
        }
      }

      const payload = await request.validateUsing(createCommandeExpressValidator)

      // Séparer les items avec productId (gestion stock) et sans (colis hors app)
      const itemsWithProduct = payload.items.filter((item) => item.productId)
      const itemsWithoutProduct = payload.items.filter((item) => !item.productId)

      const stockErrors: any[] = []
      const stockUpdates: any[] = []
      let productMap = new Map()

      // Vérifier et gérer le stock uniquement pour les items avec productId
      if (itemsWithProduct.length > 0) {
        const productIds = itemsWithProduct.map((item) => item.productId!)

        const products = await Product.query({ client: trx })
          .whereIn('id', productIds)
          .preload('media')
          .forUpdate() // Lock pour éviter les race conditions

        // Créer un map des produits par ID
        productMap = new Map(products.map((p) => [p.id, p]))

        // Vérifier chaque item avec productId
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

        // Si des erreurs de stock, annuler la transaction
        if (stockErrors.length > 0) {
          await trx.rollback()
          return response.status(400).json({
            success: false,
            message: 'Stock insuffisant pour certains produits',
            errors: stockErrors,
          })
        }
      }

      // Enrichir les items avec les données produit (image, description, prix) si productId fourni
      const enrichedItems = payload.items.map((item) => {
        if (item.productId && productMap.has(item.productId)) {
          const product = productMap.get(item.productId)!
          return {
            productId: item.productId,
            name: item.name || product.name,
            description: item.description || product.description || undefined,
            price: item.price || product.price,
            quantity: item.quantity,
            weight: item.weight || undefined,
            urlProduct: item.urlProduct || product.media?.mediaUrl || undefined,
          }
        }
        return {
          productId: item.productId || undefined,
          name: item.name,
          description: item.description || undefined,
          price: item.price || undefined,
          quantity: item.quantity,
          weight: item.weight || undefined,
          urlProduct: item.urlProduct || undefined,
        }
      })

      // Créer la commande express
      const commandeExpress = await CommandeExpress.create(
        {
          orderId: randomUUID(),
          clientId: payload.clientId,
          clientName: payload.clientName,
          clientPhone: payload.clientPhone,
          vendorId: payload.vendorId,
          packageValue: payload.packageValue,
          packageDescription: payload.packageDescription,
          pickupAddress: payload.pickupAddress,
          deliveryAddress: payload.deliveryAddress,
          pickupReference: payload.pickupReference || null,
          deliveryReference: payload.deliveryReference || null,
          createdBy: payload.createdBy,
          statut: (payload.statut as CommandeExpressStatus) || CommandeExpressStatus.PENDING,
          items: enrichedItems,
          deliveryPersonId: null,
        },
        { client: trx }
      )

      // Déduire le stock uniquement pour les items avec productId
      for (const item of itemsWithProduct) {
        const product = productMap.get(item.productId!)!
        const previousStock = product.stock

        // Déduire le stock
        await Product.query({ client: trx })
          .where('id', item.productId!)
          .decrement('stock', item.quantity)

        stockUpdates.push({
          productId: item.productId,
          productName: item.name,
          previousStock: previousStock,
          newStock: previousStock - item.quantity,
          deducted: item.quantity,
        })
      }

      // Commit de la transaction
      await trx.commit()

      // Upload de l'image du colis si fournie (optionnel)
      const imageColisFile = request.file('imageColis', {
        size: '20mb',
        extnames: ['jpg', 'jpeg', 'png', 'webp'],
      })

      if (imageColisFile && imageColisFile.isValid && imageColisFile.tmpPath) {
        try {
          const uploadResult = await ecommerceCloudinaryService.uploadPackagePhoto(
            imageColisFile.tmpPath,
            `express_${commandeExpress.orderId}`
          )
          commandeExpress.imageColis = uploadResult.url
          commandeExpress.imageColisPublicId = uploadResult.publicId
          await commandeExpress.save()

          logger.info('Image colis uploadée avec succès', {
            orderId: commandeExpress.orderId,
            imageUrl: uploadResult.url,
          })
        } catch (uploadError) {
          // Ne pas bloquer la création si l'upload échoue
          logger.error('Erreur upload image colis (non bloquant)', {
            error: uploadError.message,
            orderId: commandeExpress.orderId,
          })
        }
      } else if (imageColisFile && !imageColisFile.isValid) {
        logger.warn('Fichier imageColis invalide (non bloquant)', {
          errors: imageColisFile.errors,
          orderId: commandeExpress.orderId,
        })
      }

      // Enregistrer dans Firebase collection "commandesexpress" pour les notifications
      let firebaseDocId: string | null = null
      try {
        firebaseDocId = await saveCommandeExpressToFirestore({
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          orderId: commandeExpress.orderId,
          clientId: commandeExpress.clientId,
          clientName: commandeExpress.clientName,
          clientPhone: commandeExpress.clientPhone,
          vendorId: commandeExpress.vendorId,
          packageValue: commandeExpress.packageValue,
          packageDescription: commandeExpress.packageDescription,
          pickupAddress: commandeExpress.pickupAddress,
          deliveryAddress: commandeExpress.deliveryAddress,
          pickupReference: commandeExpress.pickupReference,
          deliveryReference: commandeExpress.deliveryReference,
          statut: commandeExpress.statut,
          items: (commandeExpress.items as any[]).map((item) => ({
            productId: item.productId ?? null,
            name: item.name,
            description: item.description ?? null,
            price: item.price ?? null,
            quantity: item.quantity,
            weight: item.weight ?? null,
            urlProduct: item.urlProduct ?? null,
          })),
          deliveryPersonId: commandeExpress.deliveryPersonId,
          createdBy: commandeExpress.createdBy,
        })
        logger.info('Commande express enregistrée dans Firebase', {
          firebaseDocId,
          orderId: commandeExpress.orderId,
        })
      } catch (firebaseError) {
        // Ne pas bloquer la création si Firebase échoue
        logger.error('Erreur enregistrement commande express dans Firebase (non bloquant)', {
          error: firebaseError.message,
          code: firebaseError.code,
          orderId: commandeExpress.orderId,
        })
      }

      logger.info('Commande express créée avec succès', {
        orderId: commandeExpress.orderId,
        clientId: commandeExpress.clientId,
        vendorId: commandeExpress.vendorId,
        itemsCount: payload.items.length,
        itemsWithStock: itemsWithProduct.length,
        itemsWithoutStock: itemsWithoutProduct.length,
        firebaseDocId,
      })

      return response.status(201).json({
        success: true,
        message: 'Commande express créée avec succès',
        data: {
          commande: commandeExpress,
          firebaseDocId,
          stockUpdates: stockUpdates.length > 0 ? stockUpdates : null,
          itemsInfo: {
            total: payload.items.length,
            withProductManagement: itemsWithProduct.length,
            customItems: itemsWithoutProduct.length,
          },
        },
      })
    } catch (error) {
      await trx.rollback()

      // Si c'est une erreur de validation, retourner les détails
      if (error.code === 'E_VALIDATION_ERROR') {
        return response.status(422).json({
          success: false,
          message: 'Erreur de validation',
          errors: error.messages,
        })
      }

      logger.error('Erreur création commande express', {
        error: error.message,
        stack: error.stack,
      })

      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la commande express',
        error: error.message,
      })
    }
  }

  /**
   * GET /commande-express/list
   * Lister toutes les commandes express avec pagination
   */
  async list({ request, response }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const limit = request.input('limit', 20)
      const status = request.input('status')

      const query = CommandeExpress.query().orderBy('created_at', 'desc')

      if (status) {
        query.where('statut', status)
      }

      const commandes = await query.paginate(page, limit)

      // Récupérer les détails des livreurs assignés
      const livreurIds = commandes.all()
        .map((c) => c.deliveryPersonId)
        .filter((id): id is number => id !== null && id !== undefined)
      const livreurs = livreurIds.length > 0
        ? await User.query().whereIn('id', livreurIds).select('id', 'first_name', 'last_name', 'phone', 'email')
        : []
      const livreursMap = new Map(livreurs.map((l) => [l.id, l]))

      // Récupérer les détails des vendeurs
      const vendorIds = [...new Set(commandes.all().map((c) => c.vendorId).filter((id): id is number => id !== null && id !== undefined))]
      const vendors = vendorIds.length > 0
        ? await User.query().whereIn('id', vendorIds).select('id', 'first_name', 'last_name', 'phone', 'email')
        : []
      const vendorsMap = new Map(vendors.map((v) => [v.id, v]))

      const formattedCommandes = commandes.all().map((commande) => {
        const serialized = commande.serialize()
        const livreur = commande.deliveryPersonId ? livreursMap.get(commande.deliveryPersonId) ?? null : null
        const vendor = commande.vendorId ? vendorsMap.get(commande.vendorId) ?? null : null
        return {
          ...serialized,
          prixColis: Number(commande.packageValue),
          fraisLivraison: commande.deliveryFee ?? 0,
          totalAvecLivraison:
            commande.totalAvecLivraison ??
            (commande.deliveryFee
              ? Number(commande.packageValue) + commande.deliveryFee
              : Number(commande.packageValue)),
          livreur: livreur
            ? { id: livreur.id, firstName: livreur.firstName, lastName: livreur.lastName, phone: livreur.phone, email: livreur.email }
            : null,
          vendor: vendor
            ? { id: vendor.id, firstName: vendor.firstName, lastName: vendor.lastName, phone: vendor.phone, email: vendor.email }
            : null,
        }
      })

      return response.status(200).json({
        success: true,
        data: {
          meta: {
            total: commandes.total,
            perPage: commandes.perPage,
            currentPage: commandes.currentPage,
            lastPage: commandes.lastPage,
            firstPage: commandes.firstPage,
            hasMorePages: commandes.hasMorePages,
          },
          data: formattedCommandes,
        },
      })
    } catch (error) {
      logger.error('Erreur liste commandes express', {
        error: error.message,
      })

      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des commandes',
        error: error.message,
      })
    }
  }

  /**
   * GET /commande-express/mes-commandes
   * Récupérer les commandes du client connecté
   */
  async mesCommandes({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user!
      const page = request.input('page', 1)
      const limit = request.input('limit', 20)
      const status = request.input('status')

      const query = CommandeExpress.query()
        .where('client_id', user.id)
        .orderBy('created_at', 'desc')

      if (status) {
        query.where('statut', status)
      }

      const commandes = await query.paginate(page, limit)

      return response.status(200).json({
        success: true,
        data: commandes,
      })
    } catch (error) {
      logger.error('Erreur récupération mes commandes express', {
        userId: auth.user?.id,
        error: error.message,
      })

      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de vos commandes',
        error: error.message,
      })
    }
  }

  /**
   * GET /commande-express/:id
   * Récupérer les détails d'une commande express
   */
  async show({ params, response }: HttpContext) {
    try {
      // Chercher par ID numérique OU par orderId (UUID)
      let commande: CommandeExpress | null = null
      
      if (!isNaN(Number(params.id))) {
        commande = await CommandeExpress.find(params.id)
      } else {
        commande = await CommandeExpress.findBy('orderId', params.id)
      }

      if (!commande) {
        return response.status(404).json({
          success: false,
          message: 'Commande express non trouvée',
        })
      }

      return response.status(200).json({
        success: true,
        data: commande,
      })
    } catch (error) {
      logger.error('Erreur récupération commande express', {
        commandeId: params.id,
        error: error.message,
      })

      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de la commande',
        error: error.message,
      })
    }
  }

  /**
   * PATCH /commande-express/:id/status
   * Mettre à jour le statut d'une commande express
   */
  async updateStatus({ params, request, response, auth }: HttpContext) {
    try {
      const user = auth.user!
      const payload = await request.validateUsing(updateCommandeExpressStatusValidator)

      // Chercher par ID numérique OU par orderId (UUID)
      let commande: CommandeExpress | null = null
      
      if (!isNaN(Number(params.id))) {
        commande = await CommandeExpress.find(params.id)
      } else {
        commande = await CommandeExpress.findBy('orderId', params.id)
      }

      if (!commande) {
        return response.status(404).json({
          success: false,
          message: 'Commande express non trouvée',
        })
      }

      const oldStatus = commande.statut

      commande.statut = payload.statut as CommandeExpressStatus
      await commande.save()

      logger.info('Statut commande express mis à jour', {
        commandeId: commande.id,
        orderId: commande.orderId,
        oldStatus,
        newStatus: payload.statut,
        changedBy: user.id,
      })

      return response.status(200).json({
        success: true,
        message: 'Statut de la commande mis à jour avec succès',
        data: commande,
      })
    } catch (error) {
      logger.error('Erreur mise à jour statut commande express', {
        commandeId: params.id,
        error: error.message,
      })

      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du statut',
        error: error.message,
      })
    }
  }

  /**
   * DELETE /commande-express/:id
   * Supprimer une commande express et restaurer le stock (uniquement pour items avec productId)
   */
  async delete({ params, response, auth }: HttpContext) {
    const trx = await db.transaction()

    try {
      const user = auth.user!

      // Chercher par ID numérique OU par orderId (UUID)
      let commande = await CommandeExpress.query({ client: trx })
        .where('id', params.id)
        .forUpdate()
        .first()
      
      // Si pas trouvé par ID numérique, essayer avec orderId
      if (!commande) {
        commande = await CommandeExpress.query({ client: trx })
          .where('orderId', params.id)
          .forUpdate()
          .first()
      }

      if (!commande) {
        await trx.rollback()
        return response.status(404).json({
          success: false,
          message: 'Commande express non trouvée',
        })
      }

      // Restaurer le stock uniquement pour les items avec productId
      const itemsWithProduct = commande.items.filter((item) => item.productId)
      const stockRestored: any[] = []

      for (const item of itemsWithProduct) {
        const product = await Product.find(item.productId!, { client: trx })

        if (product) {
          const previousStock = product.stock

          // Restaurer le stock
          await Product.query({ client: trx })
            .where('id', item.productId!)
            .increment('stock', item.quantity)

          stockRestored.push({
            productId: item.productId,
            productName: item.name,
            previousStock,
            newStock: previousStock + item.quantity,
            restored: item.quantity,
          })
        }
      }

      // Supprimer l'image Cloudinary si elle existe
      if (commande.imageColisPublicId) {
        try {
          await ecommerceCloudinaryService.deletePhoto(commande.imageColisPublicId)
          logger.info('Image colis supprimée de Cloudinary', {
            orderId: commande.orderId,
            publicId: commande.imageColisPublicId,
          })
        } catch (cloudinaryError) {
          logger.warn('Erreur suppression image colis Cloudinary (non bloquant)', {
            error: cloudinaryError.message,
            publicId: commande.imageColisPublicId,
          })
        }
      }

      // Supprimer la commande
      await commande.delete()

      await trx.commit()

      logger.info('Commande express supprimée et stock restauré', {
        commandeId: params.id,
        orderId: commande.orderId,
        deletedBy: user.id,
        stockRestored: stockRestored.length,
      })

      return response.status(200).json({
        success: true,
        message: stockRestored.length > 0 
          ? 'Commande supprimée et stock restauré avec succès'
          : 'Commande supprimée avec succès (aucun produit à restaurer)',
        data: {
          deletedCommande: {
            id: commande.id,
            orderId: commande.orderId,
          },
          stockRestored: stockRestored.length > 0 ? stockRestored : null,
        },
      })
    } catch (error) {
      await trx.rollback()

      logger.error('Erreur suppression commande express', {
        commandeId: params.id,
        error: error.message,
      })

      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression de la commande',
        error: error.message,
      })
    }
  }

  /**
   * PATCH /commande-express/:id/assign-livreur
   * Assigner un livreur à une commande express
   */
  async assignLivreur({ params, request, response, auth }: HttpContext) {
    logger.info('🚀 ENTREE function assignLivreur', { commandeId: params.id })
    try {
      const user = auth.user!
      logger.info('👤 User authentifié', { userId: user.id })
      const payload = await request.validateUsing(assignDeliveryPersonValidator)
      logger.info('✅ Validation payload OK', { deliveryPersonId: payload.deliveryPersonId })

      // Chercher par ID numérique OU par orderId (UUID)
      let commande: CommandeExpress | null = null
      
      // Vérifier si c'est un nombre (ID) ou un UUID
      if (!isNaN(Number(params.id))) {
        commande = await CommandeExpress.find(params.id)
      } else {
        commande = await CommandeExpress.findBy('orderId', params.id)
      }
      
      logger.info('📦 Commande trouvée', {
        commandeId: commande?.id,
        statut: commande?.statut,
        livreurActuel: commande?.deliveryPersonId,
      })

      if (!commande) {
        return response.status(404).json({
          success: false,
          message: 'Commande express non trouvée',
        })
      }

      const oldStatus = commande.statut
      const statutValue = String(oldStatus) // Convert to string for comparison

      logger.info('🔍 Checking statut before assignment', { 
        commandeId: commande.id,
        oldStatus, 
        statutValue,
        type: typeof oldStatus,
        isPending: statutValue === 'pending',
      })

      // Si la commande est pending, changer automatiquement à en_cours lors de l'assignation
      if (statutValue === 'pending') {
        logger.info('✅ Statut est pending, changement automatique à en_cours')
        
        try {
          // Utiliser rawQuery avec la bonne syntaxe AdonisJS
          const result = await db.rawQuery(
            'UPDATE commande_express SET delivery_person_id = ?, statut = ?, updated_at = NOW() WHERE id = ? RETURNING id, statut, delivery_person_id',
            [payload.deliveryPersonId, 'en_cours', commande.id]
          )
          
          logger.info('✅ UPDATE query executed', { 
            rowsAffected: result.rowCount,
            returning: result.rows
          })
          
          // Recharger la commande pour avoir les données à jour
          await commande.refresh()
          
          logger.info('✅ Commande refreshed', { 
            newStatut: commande.statut,
            newLivreur: commande.deliveryPersonId
          })
        } catch (error) {
          logger.error('❌ ERROR in UPDATE query', { 
            errorMessage: error.message, 
            errorCode: error.code,
            errorDetail: error.detail,
            stack: error.stack 
          })
          throw error
        }
      } else {
        logger.info('ℹ️ Statut non-pending, assignation livreur sans changement de statut')
        // Sinon, juste assigner le livreur sans changer le statut
        commande.deliveryPersonId = payload.deliveryPersonId
        await commande.save()
      }

      logger.info('Livreur assigné à la commande express', {
        commandeId: commande.id,
        orderId: commande.orderId,
        deliveryPersonId: payload.deliveryPersonId,
        oldStatus,
        newStatus: commande.statut,
        assignedBy: user.id,
      })

      return response.status(200).json({
        success: true,
        message: 'Livreur assigné avec succès',
        data: commande,
      })
    } catch (error) {
      logger.error('Erreur assignation livreur commande express', {
        commandeId: params.id,
        error: error.message,
      })

      return response.status(500).json({
        success: false,
        message: "Erreur lors de l'assignation du livreur",
        error: error.message,
      })
    }
  }

  /**
   * GET /commande-express/debug-update/:id
   * DEBUG: Test raw SQL update
   */
  async debugUpdate({ params, response }: HttpContext) {
    try {
      const commande = await CommandeExpress.find(params.id)
      if (!commande) {
        return response.status(404).json({ error: 'Commande not found' })
      }
      
      const beforeStatut = commande.statut
      const beforeStatutStr = String(beforeStatut)
      const isPendingTest = beforeStatutStr === 'pending'
      
      let sqlResult = null
      
      if (isPendingTest) {
        sqlResult = await db.rawQuery(
          'UPDATE commande_express SET statut = $1, updated_at = NOW() WHERE id = $2 RETURNING id, statut',
          ['en_cours', params.id]
        )
        
        await commande.refresh()
      }
      
      return response.json({
        debug: {
          beforeStatut,
          beforeStatutStr,
          beforeType: typeof beforeStatut,
          isPendingTest,
          sqlExecuted: isPendingTest,
          sqlResult: sqlResult ? sqlResult.rows : null,
          afterRefresh: {
            statut: commande.statut,
            statutStr: String(commande.statut),
            type: typeof commande.statut
          }
        }
      })
    } catch (error) {
      return response.status(500).json({ error: error.message })
    }
  }


  /**
   * GET /commande-express/livreur/disponibles
   * Récupérer les commandes disponibles pour les livreurs (statut pending uniquement)
   */
  async disponiblesPourLivreur({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user!
      const page = request.input('page', 1)
      const limit = request.input('limit', 20)

      let commandesQuery = CommandeExpress.query()
        .where('statut', CommandeExpressStatus.PENDING)
        .whereNull('delivery_person_id')
        .orderBy('created_at', 'desc')

      // Filtrer par communes si le livreur a des zones assignées
      if (user.communes && user.communes.length > 0) {
        commandesQuery = commandesQuery.where((builder) => {
          builder
            .whereIn(db.raw("address->>'commune'"), user.communes)
            .orWhereRaw("(address->>'commune') IS NULL")
        })
      }

      const commandes = await commandesQuery.paginate(page, limit)

      return response.status(200).json({
        success: true,
        data: commandes,
      })
    } catch (error) {
      logger.error('Erreur récupération commandes disponibles', {
        error: error.message,
      })

      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des commandes disponibles',
        error: error.message,
      })
    }
  }

  /**
   * GET /commande-express/livreur/mes-livraisons
   * Récupérer les livraisons du livreur connecté (TOUS sans pagination)
   */
  async mesLivraisons({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user!
      const status = request.input('status')

      // Utiliser la requête SQL brute pour éviter la pagination automatique
      let sql = `
        SELECT * FROM commande_express
        WHERE delivery_person_id = ?
      `
      const bindings: any[] = [user.id]
      
      if (status) {
        sql += ` AND statut = ?`
        bindings.push(status)
      }
      
      sql += ` ORDER BY created_at DESC`

      // Exécuter la requête brute
      const result = await db.rawQuery(sql, bindings)

      return response.status(200).json({
        success: true,
        data: result.rows,
      })
    } catch (error) {
      logger.error('Erreur récupération mes livraisons', {
        userId: auth.user?.id,
        error: error.message,
      })

      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de vos livraisons',
        error: error.message,
      })
    }
  }

  /**
   * PATCH /commande-express/vendeur/:id/annuler
   * Annuler une commande express en tant que vendeur
   * Règles :
   *   - L'utilisateur connecté doit être le vendeur de la commande (vendor_id)
   *   - La commande doit être dans un statut annulable (pending_payment, pending, en_preparation, pret_a_expedier)
   *   - Le stock des produits liés est restauré
   */
  async annulerVendeur({ params, request, response, auth }: HttpContext) {
    const trx = await db.transaction()

    try {
      const user = auth.user!
      const payload = await request.validateUsing(cancelCommandeExpressVendeurValidator)

      // Récupérer la commande avec lock pour éviter les race conditions
      let commande = await CommandeExpress.query({ client: trx })
        .where('id', params.id)
        .forUpdate()
        .first()

      if (!commande) {
        commande = await CommandeExpress.query({ client: trx })
          .where('orderId', params.id)
          .forUpdate()
          .first()
      }

      if (!commande) {
        await trx.rollback()
        return response.status(404).json({
          success: false,
          message: 'Commande express non trouvée',
        })
      }

      // Vérifier que le vendeur connecté est bien propriétaire de la commande
      if (commande.vendorId !== user.id) {
        await trx.rollback()
        return response.status(403).json({
          success: false,
          message: 'Vous n\'êtes pas autorisé à annuler cette commande',
        })
      }

      // Statuts qui autorisent l'annulation par le vendeur
      const statutsAnnulables: string[] = [
        CommandeExpressStatus.PENDING_PAYMENT,
        CommandeExpressStatus.PENDING,
        CommandeExpressStatus.EN_PREPARATION,
        CommandeExpressStatus.PRET_A_EXPEDIER,
      ]

      const statutActuel = String(commande.statut)

      if (commande.statut === CommandeExpressStatus.CANCELLED) {
        await trx.rollback()
        return response.status(409).json({
          success: false,
          message: 'Cette commande est déjà annulée',
        })
      }

      if (!statutsAnnulables.includes(statutActuel)) {
        await trx.rollback()
        return response.status(422).json({
          success: false,
          message: 'Impossible d\'annuler cette commande : un livreur a déjà pris en charge la livraison ou la commande est terminée',
          statut_actuel: statutActuel,
          statuts_annulables: statutsAnnulables,
        })
      }

      const ancienStatut = commande.statut

      // Restaurer le stock pour les items ayant un productId
      const itemsAvecProduit = commande.items.filter((item) => item.productId)
      const stockRestaure: any[] = []

      for (const item of itemsAvecProduit) {
        const product = await Product.find(item.productId!, { client: trx })

        if (product) {
          const stockPrecedent = product.stock

          await Product.query({ client: trx })
            .where('id', item.productId!)
            .increment('stock', item.quantity)

          stockRestaure.push({
            productId: item.productId,
            productName: item.name,
            stockPrecedent,
            nouveauStock: stockPrecedent + item.quantity,
            quantiteRestauree: item.quantity,
          })
        }
      }

      // Mettre à jour le statut en annulé
      commande.statut = CommandeExpressStatus.CANCELLED
      await commande.useTransaction(trx).save()

      await trx.commit()

      logger.info('Commande express annulée par le vendeur', {
        commandeId: commande.id,
        orderId: commande.orderId,
        vendorId: user.id,
        ancienStatut,
        raison: payload.raison || null,
        stockRestaure: stockRestaure.length,
      })

      return response.status(200).json({
        success: true,
        message: 'Commande express annulée avec succès',
        data: {
          commande: {
            id: commande.id,
            orderId: commande.orderId,
            statut: commande.statut,
            ancienStatut,
          },
          raison: payload.raison || null,
          stockRestaure: stockRestaure.length > 0 ? stockRestaure : null,
        },
      })
    } catch (error) {
      await trx.rollback()

      if (error.code === 'E_VALIDATION_ERROR') {
        return response.status(422).json({
          success: false,
          message: 'Erreur de validation',
          errors: error.messages,
        })
      }

      logger.error('Erreur annulation commande express vendeur', {
        commandeId: params.id,
        vendorId: auth.user?.id,
        error: error.message,
      })

      return response.status(500).json({
        success: false,
        message: 'Erreur lors de l\'annulation de la commande',
        error: error.message,
      })
    }
  }

  /**
   * GET /commande-express/vendeur/mes-commandes
   * Récupérer les commandes express du vendeur connecté
   */
  async mesCommandesVendeur({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user!
      const page = request.input('page', 1)
      const limit = request.input('limit', 20)
      const status = request.input('status')

      const query = CommandeExpress.query()
        .where('vendor_id', user.id)
        .orderBy('created_at', 'desc')

      if (status) {
        query.where('statut', status)
      }

      const commandes = await query.paginate(page, limit)

      return response.status(200).json({
        success: true,
        data: commandes,
      })
    } catch (error) {
      logger.error('Erreur récupération commandes vendeur', {
        vendorId: auth.user?.id,
        error: error.message,
      })

      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de vos commandes',
        error: error.message,
      })
    }
  }
}
