import EcommerceOrder, { EcommerceOrderStatus } from '#models/ecommerce_order'
import PaymentMethodTemplate from '#models/payment_method_template'
import User from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import { UserRole } from '../Enum/user_role.js'

export default class AdminTransactionsController {
  /**
   * GET /admin/transactions
   * Voir toutes les transactions e-commerce avec détails de paiement (admin/superadmin)
   *
   * Query params:
   *  - page (default 1)
   *  - limit (default 20)
   *  - vendor_id (optionnel) : filtrer par vendeur
   *  - client_id (optionnel) : filtrer par client
   *  - payment_type (optionnel) : filtrer par type de moyen de paiement (cash, mpesa, orange_money, etc.)
   *  - date_from (optionnel) : date de début (YYYY-MM-DD)
   *  - date_to (optionnel) : date de fin (YYYY-MM-DD)
   */
  async index({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user!

      // Vérifier que l'utilisateur est admin ou superadmin
      if (user.role !== UserRole.ADMIN && user.role !== UserRole.SuperAdmin) {
        return response.forbidden({
          success: false,
          message: 'Seuls les administrateurs peuvent consulter les transactions',
          status: 403,
        })
      }

      const page = request.input('page', 1)
      const limit = request.input('limit', 20)
      const vendorId = request.input('vendor_id')
      const clientId = request.input('client_id')
      const paymentType = request.input('payment_type')
      const dateFrom = request.input('date_from')
      const dateTo = request.input('date_to')

      // Construire la requête — uniquement les commandes livrées (transactions complètes)
      let query = EcommerceOrder.query()
        .where('status', EcommerceOrderStatus.DELIVERED)
        .preload('paymentMethod')
        .preload('vendor')
        .preload('clientUser')
        .orderBy('createdAt', 'desc')
      if (vendorId) {
        query = query.where('vendorId', vendorId)
      }
      if (clientId) {
        query = query.where('clientId', clientId)
      }
      if (dateFrom) {
        query = query.where('createdAt', '>=', `${dateFrom} 00:00:00`)
      }
      if (dateTo) {
        query = query.where('createdAt', '<=', `${dateTo} 23:59:59`)
      }
      // Filtre par type de moyen de paiement (nécessite un join)
      if (paymentType) {
        query = query
          .whereNotNull('paymentMethodId')
          .whereHas('paymentMethod', (pmQuery) => {
            pmQuery.where('type', paymentType)
          })
      }

      const orders = await query.paginate(page, limit)

      // Récupérer les templates pour enrichir les infos de paiement (images, noms)
      const templates = await PaymentMethodTemplate.query()
      const templatesMap = new Map(templates.map((t) => [t.type, t]))

      // Formater les transactions
      const transactions = orders.all().map((order) => {
        const pm = order.paymentMethod
        const template = pm ? templatesMap.get(pm.type) : null

        return {
          id: order.id,
          orderId: order.orderId,
          status: order.status,
          total: order.total,
          deliveryFee: order.deliveryFee,
          distanceKm: order.distanceKm,
          numeroPayment: order.numeroPayment,
          codeColis: order.codeColis,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,

          // Infos client
          client: {
            id: order.clientId,
            name: order.client,
            phone: order.phone,
            email: order.clientUser?.email || null,
          },

          // Infos vendeur
          vendor: {
            id: order.vendorId,
            firstName: order.vendor?.firstName || null,
            lastName: order.vendor?.lastName || null,
            phone: order.vendor?.phone || null,
            email: order.vendor?.email || null,
          },

          // Infos livreur
          deliveryPersonId: order.deliveryPersonId,

          // Détails produits
          items: order.items,

          // Adresse de livraison
          address: order.address,

          // Moyen de paiement détaillé
          paymentMethod: pm
            ? {
                id: pm.id,
                type: pm.type,
                name: template?.name || pm.type,
                description: template?.description || null,
                imageUrl: template?.imageUrl || null,
                numeroCompte: pm.numeroCompte,
                nomTitulaire: pm.nomTitulaire,
                isDefault: pm.isDefault,
                isActive: pm.isActive,
              }
            : null,
        }
      })

      // Calculer les totaux pour le résumé (uniquement commandes livrées)
      const allOrdersForStats = await EcommerceOrder.query()
        .where('status', EcommerceOrderStatus.DELIVERED)
        .if(vendorId, (q) => q.where('vendorId', vendorId))
        .if(clientId, (q) => q.where('clientId', clientId))
        .if(dateFrom, (q) => q.where('createdAt', '>=', `${dateFrom} 00:00:00`))
        .if(dateTo, (q) => q.where('createdAt', '<=', `${dateTo} 23:59:59`))

      const totalRevenue = allOrdersForStats.reduce((sum, o) => sum + (Number(o.total) || 0), 0)
      const totalDeliveryFees = allOrdersForStats.reduce(
        (sum, o) => sum + (Number(o.deliveryFee) || 0),
        0
      )

      return response.ok({
        success: true,
        message: 'Transactions récupérées avec succès',
        data: transactions,
        summary: {
          totalTransactions: orders.total,
          totalRevenue,
          totalDeliveryFees,
        },
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
      logger.error('Erreur lors de la récupération des transactions admin', {
        message: error.message,
        stack: error.stack,
      })
      return response.internalServerError({
        success: false,
        message: 'Erreur interne lors de la récupération des transactions',
        status: 500,
        error: error.message,
      })
    }
  }

  /**
   * GET /admin/transactions/:id
   * Voir le détail complet d'une transaction (admin/superadmin)
   */
  async show({ params, response, auth }: HttpContext) {
    try {
      const user = auth.user!

      if (user.role !== UserRole.ADMIN && user.role !== UserRole.SuperAdmin) {
        return response.forbidden({
          success: false,
          message: 'Seuls les administrateurs peuvent consulter les transactions',
          status: 403,
        })
      }

      const order = await EcommerceOrder.query()
        .where('id', params.id)
        .where('status', EcommerceOrderStatus.DELIVERED)
        .preload('paymentMethod')
        .preload('vendor')
        .preload('clientUser')
        .firstOrFail()

      const templates = await PaymentMethodTemplate.query()
      const templatesMap = new Map(templates.map((t) => [t.type, t]))

      const pm = order.paymentMethod
      const template = pm ? templatesMap.get(pm.type) : null

      // Récupérer les infos du livreur si assigné
      let deliveryPerson = null
      if (order.deliveryPersonId) {
        const livreur = await User.find(order.deliveryPersonId)
        if (livreur) {
          deliveryPerson = {
            id: livreur.id,
            firstName: livreur.firstName,
            lastName: livreur.lastName,
            phone: livreur.phone,
            email: livreur.email,
          }
        }
      }

      const transaction = {
        id: order.id,
        orderId: order.orderId,
        status: order.status,
        total: order.total,
        deliveryFee: order.deliveryFee,
        distanceKm: order.distanceKm,
        numeroPayment: order.numeroPayment,
        codeColis: order.codeColis,
        packagePhoto: order.packagePhoto,
        firebaseOrderId: order.firebaseOrderId,
        latitude: order.latitude,
        longitude: order.longitude,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,

        client: {
          id: order.clientId,
          name: order.client,
          phone: order.phone,
          email: order.clientUser?.email || null,
        },

        vendor: {
          id: order.vendorId,
          firstName: order.vendor?.firstName || null,
          lastName: order.vendor?.lastName || null,
          phone: order.vendor?.phone || null,
          email: order.vendor?.email || null,
        },

        deliveryPerson,

        items: order.items,
        address: order.address,

        paymentMethod: pm
          ? {
              id: pm.id,
              type: pm.type,
              name: template?.name || pm.type,
              description: template?.description || null,
              imageUrl: template?.imageUrl || null,
              numeroCompte: pm.numeroCompte,
              nomTitulaire: pm.nomTitulaire,
              isDefault: pm.isDefault,
              isActive: pm.isActive,
            }
          : null,
      }

      return response.ok({
        success: true,
        message: 'Transaction récupérée avec succès',
        data: transaction,
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          success: false,
          message: 'Transaction introuvable',
          status: 404,
        })
      }
      logger.error('Erreur lors de la récupération du détail de la transaction', {
        message: error.message,
        stack: error.stack,
      })
      return response.internalServerError({
        success: false,
        message: 'Erreur interne lors de la récupération de la transaction',
        status: 500,
        error: error.message,
      })
    }
  }

  /**
   * GET /admin/transactions/stats
   * Statistiques globales des transactions (admin/superadmin)
   */
  async stats({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user!

      if (user.role !== UserRole.ADMIN && user.role !== UserRole.SuperAdmin) {
        return response.forbidden({
          success: false,
          message: 'Seuls les administrateurs peuvent consulter les statistiques',
          status: 403,
        })
      }

      const dateFrom = request.input('date_from')
      const dateTo = request.input('date_to')

      // Uniquement les commandes livrées
      let query = EcommerceOrder.query()
        .where('status', EcommerceOrderStatus.DELIVERED)
      if (dateFrom) {
        query = query.where('createdAt', '>=', `${dateFrom} 00:00:00`)
      }
      if (dateTo) {
        query = query.where('createdAt', '<=', `${dateTo} 23:59:59`)
      }

      const allOrders = await query

      // Compter par type de moyen de paiement
      const paymentMethodIds = [
        ...new Set(allOrders.map((o) => o.paymentMethodId).filter(Boolean)),
      ]

      const paymentTypeCounts: Record<string, { count: number; total: number }> = {}
      if (paymentMethodIds.length > 0) {
        const { default: PaymentMethod } = await import('#models/payment_method')
        const paymentMethods = await PaymentMethod.query().whereIn(
          'id',
          paymentMethodIds as number[]
        )
        const pmMap = new Map(paymentMethods.map((pm) => [pm.id, pm]))

        allOrders.forEach((o) => {
          if (o.paymentMethodId) {
            const pm = pmMap.get(o.paymentMethodId)
            if (pm) {
              if (!paymentTypeCounts[pm.type]) {
                paymentTypeCounts[pm.type] = { count: 0, total: 0 }
              }
              paymentTypeCounts[pm.type].count++
              paymentTypeCounts[pm.type].total += Number(o.total) || 0
            }
          }
        })
      }

      // Commandes sans moyen de paiement
      const withoutPayment = allOrders.filter((o) => !o.paymentMethodId).length

      const totalRevenue = allOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0)
      const totalDeliveryFees = allOrders.reduce((sum, o) => sum + (Number(o.deliveryFee) || 0), 0)

      return response.ok({
        success: true,
        message: 'Statistiques des transactions récupérées avec succès',
        data: {
          totalTransactions: allOrders.length,
          totalRevenue,
          totalDeliveryFees,
          byPaymentMethod: paymentTypeCounts,
          withoutPaymentMethod: withoutPayment,
        },
      })
    } catch (error) {
      logger.error('Erreur lors de la récupération des statistiques de transactions', {
        message: error.message,
        stack: error.stack,
      })
      return response.internalServerError({
        success: false,
        message: 'Erreur interne lors de la récupération des statistiques',
        status: 500,
        error: error.message,
      })
    }
  }
}
