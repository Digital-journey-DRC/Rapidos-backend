import type { HttpContext } from '@adonisjs/core/http'
import CommandeExpress, { CommandeExpressStatus } from '#models/commande_express'
import Product from '#models/product'
import {
  createCommandeExpressValidator,
  updateCommandeExpressStatusValidator,
  assignDeliveryPersonValidator,
} from '#validators/commande_express'
import { randomUUID } from 'node:crypto'
import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'

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
          items: payload.items,
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

      logger.info('Commande express créée avec succès', {
        orderId: commandeExpress.orderId,
        clientId: commandeExpress.clientId,
        vendorId: commandeExpress.vendorId,
        itemsCount: payload.items.length,
        itemsWithStock: itemsWithProduct.length,
        itemsWithoutStock: itemsWithoutProduct.length,
      })

      return response.status(201).json({
        success: true,
        message: 'Commande express créée avec succès',
        data: {
          commande: commandeExpress,
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

      return response.status(200).json({
        success: true,
        data: commandes,
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
      const commande = await CommandeExpress.find(params.id)

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

      const commande = await CommandeExpress.find(params.id)

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

      const commande = await CommandeExpress.query({ client: trx })
        .where('id', params.id)
        .forUpdate()
        .first()

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
    try {
      const user = auth.user!
      const payload = await request.validateUsing(assignDeliveryPersonValidator)

      const commande = await CommandeExpress.find(params.id)

      if (!commande) {
        return response.status(404).json({
          success: false,
          message: 'Commande express non trouvée',
        })
      }

      commande.deliveryPersonId = payload.deliveryPersonId
      await commande.save()

      logger.info('Livreur assigné à la commande express', {
        commandeId: commande.id,
        orderId: commande.orderId,
        deliveryPersonId: payload.deliveryPersonId,
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
   * GET /commande-express/livreur/disponibles
   * Récupérer les commandes disponibles pour les livreurs (statut pending ou en_cours)
   */
  async disponiblesPourLivreur({ request, response }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const limit = request.input('limit', 20)

      const commandes = await CommandeExpress.query()
        .whereIn('statut', [CommandeExpressStatus.PENDING, CommandeExpressStatus.EN_COURS])
        .whereNull('delivery_person_id')
        .orderBy('created_at', 'desc')
        .paginate(page, limit)

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
   * Récupérer les livraisons du livreur connecté (exclut les commandes pending)
   */
  async mesLivraisons({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user!
      const page = request.input('page', 1)
      const limit = request.input('limit', 20)
      const status = request.input('status')

      const query = CommandeExpress.query()
        .where('delivery_person_id', user.id)
        .whereNot('statut', CommandeExpressStatus.PENDING)
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
