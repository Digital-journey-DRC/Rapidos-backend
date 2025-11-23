import { AnalyticsService } from '#services/analytics_service';
import { createProductEventValidator, viewProductEventValidator, addToCartEventValidator, addToWishlistEventValidator, purchaseEventValidator, searchEventValidator, } from '#validators/product_event';
import { EventType } from '../Enum/event_type.js';
import logger from '@adonisjs/core/services/logger';
export default class EventsController {
    async store({ request, response, auth }) {
        try {
            const payload = await request.validateUsing(createProductEventValidator);
            const userId = payload.userId || auth.user?.id || null;
            if (payload.eventType !== EventType.SEARCH && !payload.productId) {
                return response.status(422).json({
                    message: `productId est obligatoire pour l'événement de type ${payload.eventType}`,
                });
            }
            if (payload.eventType === EventType.SEARCH && !payload.searchQuery) {
                return response.status(422).json({
                    message: 'searchQuery est obligatoire pour l\'événement de type search',
                });
            }
            const event = await AnalyticsService.logEvent({
                userId,
                productId: payload.productId || undefined,
                productCategoryId: payload.productCategoryId || undefined,
                productCategoryName: payload.productCategoryName || undefined,
                eventType: payload.eventType,
                searchQuery: payload.searchQuery || undefined,
                metadata: payload.metadata || undefined,
            });
            return response.status(201).json({
                message: 'Événement enregistré avec succès',
                event: {
                    id: event.id,
                    userId: event.userId,
                    productId: event.productId,
                    productCategoryId: event.productCategoryId,
                    productCategoryName: event.productCategoryName,
                    eventType: event.eventType,
                    searchQuery: event.searchQuery,
                    metadata: event.metadata,
                    createdAt: event.createdAt,
                },
            });
        }
        catch (error) {
            if (error.code === 'E_VALIDATION_FAILURE') {
                return response.status(422).json({
                    message: 'Données invalides',
                    errors: error.messages,
                });
            }
            logger.error('Erreur lors de l\'enregistrement de l\'événement', {
                error: error.message,
                stack: error.stack,
            });
            return response.status(500).json({
                message: 'Erreur serveur interne',
                error: error.message,
            });
        }
    }
    async logViewProduct({ request, response, auth }) {
        try {
            const payload = await request.validateUsing(viewProductEventValidator);
            const userId = auth.user?.id || null;
            const event = await AnalyticsService.logViewProduct(userId, payload.productId, payload.metadata);
            return response.status(201).json({
                message: 'Événement view_product enregistré avec succès',
                event: {
                    id: event.id,
                    userId: event.userId,
                    productId: event.productId,
                    productCategoryId: event.productCategoryId,
                    productCategoryName: event.productCategoryName,
                    eventType: event.eventType,
                    metadata: event.metadata,
                    createdAt: event.createdAt,
                },
            });
        }
        catch (error) {
            if (error.code === 'E_VALIDATION_FAILURE') {
                return response.status(422).json({
                    message: 'Données invalides',
                    errors: error.messages,
                });
            }
            logger.error('Erreur lors de l\'enregistrement de view_product', {
                error: error.message,
                stack: error.stack,
            });
            return response.status(500).json({
                message: 'Erreur serveur interne',
                error: error.message,
            });
        }
    }
    async logAddToCart({ request, response, auth }) {
        try {
            const payload = await request.validateUsing(addToCartEventValidator);
            const userId = auth.user?.id || null;
            const event = await AnalyticsService.logAddToCart(userId, payload.productId, payload.metadata);
            return response.status(201).json({
                message: 'Événement add_to_cart enregistré avec succès',
                event: {
                    id: event.id,
                    userId: event.userId,
                    productId: event.productId,
                    productCategoryId: event.productCategoryId,
                    productCategoryName: event.productCategoryName,
                    eventType: event.eventType,
                    metadata: event.metadata,
                    createdAt: event.createdAt,
                },
            });
        }
        catch (error) {
            if (error.code === 'E_VALIDATION_FAILURE') {
                return response.status(422).json({
                    message: 'Données invalides',
                    errors: error.messages,
                });
            }
            logger.error('Erreur lors de l\'enregistrement de add_to_cart', {
                error: error.message,
                stack: error.stack,
            });
            return response.status(500).json({
                message: 'Erreur serveur interne',
                error: error.message,
            });
        }
    }
    async logAddToWishlist({ request, response, auth }) {
        try {
            const payload = await request.validateUsing(addToWishlistEventValidator);
            const userId = auth.user?.id || null;
            const event = await AnalyticsService.logAddToWishlist(userId, payload.productId, payload.metadata);
            return response.status(201).json({
                message: 'Événement add_to_wishlist enregistré avec succès',
                event: {
                    id: event.id,
                    userId: event.userId,
                    productId: event.productId,
                    productCategoryId: event.productCategoryId,
                    productCategoryName: event.productCategoryName,
                    eventType: event.eventType,
                    metadata: event.metadata,
                    createdAt: event.createdAt,
                },
            });
        }
        catch (error) {
            if (error.code === 'E_VALIDATION_FAILURE') {
                return response.status(422).json({
                    message: 'Données invalides',
                    errors: error.messages,
                });
            }
            logger.error('Erreur lors de l\'enregistrement de add_to_wishlist', {
                error: error.message,
                stack: error.stack,
            });
            return response.status(500).json({
                message: 'Erreur serveur interne',
                error: error.message,
            });
        }
    }
    async logPurchase({ request, response, auth }) {
        try {
            const payload = await request.validateUsing(purchaseEventValidator);
            const userId = auth.user?.id || null;
            const event = await AnalyticsService.logPurchase(userId, payload.productId, payload.metadata);
            return response.status(201).json({
                message: 'Événement purchase enregistré avec succès',
                event: {
                    id: event.id,
                    userId: event.userId,
                    productId: event.productId,
                    productCategoryId: event.productCategoryId,
                    productCategoryName: event.productCategoryName,
                    eventType: event.eventType,
                    metadata: event.metadata,
                    createdAt: event.createdAt,
                },
            });
        }
        catch (error) {
            if (error.code === 'E_VALIDATION_FAILURE') {
                return response.status(422).json({
                    message: 'Données invalides',
                    errors: error.messages,
                });
            }
            logger.error('Erreur lors de l\'enregistrement de purchase', {
                error: error.message,
                stack: error.stack,
            });
            return response.status(500).json({
                message: 'Erreur serveur interne',
                error: error.message,
            });
        }
    }
    async logSearch({ request, response, auth }) {
        try {
            const payload = await request.validateUsing(searchEventValidator);
            const userId = auth.user?.id || null;
            const event = await AnalyticsService.logSearch(userId, payload.searchQuery, payload.metadata);
            return response.status(201).json({
                message: 'Événement search enregistré avec succès',
                event: {
                    id: event.id,
                    userId: event.userId,
                    eventType: event.eventType,
                    searchQuery: event.searchQuery,
                    metadata: event.metadata,
                    createdAt: event.createdAt,
                },
            });
        }
        catch (error) {
            if (error.code === 'E_VALIDATION_FAILURE') {
                return response.status(422).json({
                    message: 'Données invalides',
                    errors: error.messages,
                });
            }
            logger.error('Erreur lors de l\'enregistrement de search', {
                error: error.message,
                stack: error.stack,
            });
            return response.status(500).json({
                message: 'Erreur serveur interne',
                error: error.message,
            });
        }
    }
    async createTable({ response }) {
        try {
            const db = await import('@adonisjs/lucid/services/db');
            await db.default.raw('DROP TABLE IF EXISTS product_events CASCADE');
            await db.default.raw(`
        CREATE TABLE product_events (
          id SERIAL PRIMARY KEY,
          user_id INTEGER,
          product_id INTEGER,
          product_category_id INTEGER,
          product_category_name VARCHAR(255),
          event_type VARCHAR(255) NOT NULL CHECK (event_type IN ('view_product', 'add_to_cart', 'add_to_wishlist', 'purchase', 'search')),
          search_query TEXT,
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
          CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
          CONSTRAINT fk_category FOREIGN KEY (product_category_id) REFERENCES categories(id) ON DELETE SET NULL
        )
      `);
            await db.default.raw('CREATE INDEX idx_product_events_user_created ON product_events(user_id, created_at)');
            await db.default.raw('CREATE INDEX idx_product_events_product_created ON product_events(product_id, created_at)');
            await db.default.raw('CREATE INDEX idx_product_events_type_created ON product_events(event_type, created_at)');
            await db.default.raw('CREATE INDEX idx_product_events_category_created ON product_events(product_category_id, created_at)');
            return response.status(200).json({
                message: 'Table product_events créée avec succès',
                status: true,
            });
        }
        catch (error) {
            return response.status(500).json({
                message: 'Erreur lors de la création de la table',
                error: error.message,
            });
        }
    }
}
//# sourceMappingURL=events_controller.js.map