import ProductEvent from '#models/product_event'
import Product from '#models/product'
import { EventType } from '../Enum/event_type.js'
import logger from '@adonisjs/core/services/logger'

interface LogEventParams {
  userId?: number | null
  productId?: number | null
  productCategoryId?: number | null
  productCategoryName?: string | null
  eventType: EventType
  searchQuery?: string | null
  metadata?: Record<string, any> | null
}

/**
 * Service d'analytics pour logger les événements utilisateurs
 * 
 * Ce service permet d'enregistrer les actions des utilisateurs (consultation produit,
 * ajout au panier, achat, recherche, etc.) pour ensuite faire des recommandations.
 * 
 * @example
 * // Logger une consultation de produit
 * await AnalyticsService.logEvent({
 *   userId: 123,
 *   productId: 456,
 *   eventType: EventType.VIEW_PRODUCT
 * })
 * 
 * @example
 * // Logger une recherche
 * await AnalyticsService.logEvent({
 *   userId: 123,
 *   eventType: EventType.SEARCH,
 *   searchQuery: "chaussures"
 * })
 */
export class AnalyticsService {
  /**
   * Log un événement utilisateur
   * 
   * Si productId est fourni mais pas productCategoryId/productCategoryName,
   * le service récupère automatiquement la catégorie du produit.
   * 
   * @param params - Paramètres de l'événement
   * @returns L'événement créé
   */
  static async logEvent(params: LogEventParams): Promise<ProductEvent> {
    try {
      let { productId, productCategoryId, productCategoryName, eventType } = params

      // Si productId est fourni mais pas la catégorie, récupérer la catégorie du produit
      if (productId && (!productCategoryId || !productCategoryName)) {
        const product = await Product.query()
          .where('id', productId)
          .preload('category')
          .first()

        if (product && product.category) {
          productCategoryId = product.category.id
          productCategoryName = product.category.name
        }
      }

      // Validation : productId obligatoire pour tous les events SAUF "search"
      if (eventType !== EventType.SEARCH && !productId) {
        throw new Error(`productId est obligatoire pour l'événement de type ${eventType}`)
      }

      // Validation : searchQuery obligatoire pour eventType = "search"
      if (eventType === EventType.SEARCH && !params.searchQuery) {
        throw new Error('searchQuery est obligatoire pour l\'événement de type search')
      }

      const event = await ProductEvent.create({
        userId: params.userId || null,
        productId: productId || null,
        productCategoryId: productCategoryId || null,
        productCategoryName: productCategoryName || null,
        eventType,
        searchQuery: params.searchQuery || null,
        metadata: params.metadata || null,
      })

      logger.info(`Event logged: ${eventType}`, {
        eventId: event.id,
        userId: event.userId,
        productId: event.productId,
      })

      return event
    } catch (error) {
      logger.error('Erreur lors du log de l\'événement', {
        error: error.message,
        params,
      })
      throw error
    }
  }

  /**
   * Log une consultation de produit
   */
  static async logViewProduct(
    userId: number | null,
    productId: number,
    metadata?: Record<string, any>
  ): Promise<ProductEvent> {
    return this.logEvent({
      userId,
      productId,
      eventType: EventType.VIEW_PRODUCT,
      metadata,
    })
  }

  /**
   * Log un ajout au panier
   */
  static async logAddToCart(
    userId: number | null,
    productId: number,
    metadata?: Record<string, any>
  ): Promise<ProductEvent> {
    return this.logEvent({
      userId,
      productId,
      eventType: EventType.ADD_TO_CART,
      metadata,
    })
  }

  /**
   * Log un ajout en favoris
   */
  static async logAddToWishlist(
    userId: number | null,
    productId: number,
    metadata?: Record<string, any>
  ): Promise<ProductEvent> {
    return this.logEvent({
      userId,
      productId,
      eventType: EventType.ADD_TO_WISHLIST,
      metadata,
    })
  }

  /**
   * Log un achat
   */
  static async logPurchase(
    userId: number | null,
    productId: number,
    metadata?: Record<string, any>
  ): Promise<ProductEvent> {
    return this.logEvent({
      userId,
      productId,
      eventType: EventType.PURCHASE,
      metadata,
    })
  }

  /**
   * Log une recherche
   */
  static async logSearch(
    userId: number | null,
    searchQuery: string,
    metadata?: Record<string, any>
  ): Promise<ProductEvent> {
    return this.logEvent({
      userId,
      eventType: EventType.SEARCH,
      searchQuery,
      metadata,
    })
  }
}

