import ProductEvent from '#models/product_event';
import Product from '#models/product';
import { EventType } from '../Enum/event_type.js';
import logger from '@adonisjs/core/services/logger';
export class AnalyticsService {
    static async logEvent(params) {
        try {
            let { productId, productCategoryId, productCategoryName, eventType } = params;
            if (productId && (!productCategoryId || !productCategoryName)) {
                const product = await Product.query()
                    .where('id', productId)
                    .preload('category')
                    .first();
                if (product && product.category) {
                    productCategoryId = product.category.id;
                    productCategoryName = product.category.name;
                }
            }
            if (eventType !== EventType.SEARCH && !productId) {
                throw new Error(`productId est obligatoire pour l'événement de type ${eventType}`);
            }
            if (eventType === EventType.SEARCH && !params.searchQuery) {
                throw new Error('searchQuery est obligatoire pour l\'événement de type search');
            }
            const event = await ProductEvent.create({
                userId: params.userId || null,
                productId: productId || null,
                productCategoryId: productCategoryId || null,
                productCategoryName: productCategoryName || null,
                eventType,
                searchQuery: params.searchQuery || null,
                metadata: params.metadata || null,
            });
            logger.info(`Event logged: ${eventType}`, {
                eventId: event.id,
                userId: event.userId,
                productId: event.productId,
            });
            return event;
        }
        catch (error) {
            logger.error('Erreur lors du log de l\'événement', {
                error: error.message,
                params,
            });
            throw error;
        }
    }
    static async logViewProduct(userId, productId) {
        return this.logEvent({
            userId,
            productId,
            eventType: EventType.VIEW_PRODUCT,
        });
    }
    static async logAddToCart(userId, productId) {
        return this.logEvent({
            userId,
            productId,
            eventType: EventType.ADD_TO_CART,
        });
    }
    static async logAddToWishlist(userId, productId) {
        return this.logEvent({
            userId,
            productId,
            eventType: EventType.ADD_TO_WISHLIST,
        });
    }
    static async logPurchase(userId, productId, metadata) {
        return this.logEvent({
            userId,
            productId,
            eventType: EventType.PURCHASE,
            metadata,
        });
    }
    static async logSearch(userId, searchQuery) {
        return this.logEvent({
            userId,
            eventType: EventType.SEARCH,
            searchQuery,
        });
    }
}

