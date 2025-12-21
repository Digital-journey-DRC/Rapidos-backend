import EcommerceOrder, { EcommerceOrderStatus } from '#models/ecommerce_order';
import EcommerceOrderLog from '#models/ecommerce_order_log';
import { createOrderValidator, updateStatusValidator } from '#validators/ecommerce_order';
import { randomUUID } from 'node:crypto';
import logger from '@adonisjs/core/services/logger';
import ecommerceCloudinaryService from '#services/ecommerce_cloudinary_service';
import db from '@adonisjs/lucid/services/db';
export default class EcommerceOrdersController {
    async createTables({ response }) {
        try {
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
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_ecommerce_orders_order_id ON ecommerce_orders(order_id);
        CREATE INDEX IF NOT EXISTS idx_ecommerce_orders_client_id ON ecommerce_orders(client_id);
        CREATE INDEX IF NOT EXISTS idx_ecommerce_orders_vendor_id ON ecommerce_orders(vendor_id);
        CREATE INDEX IF NOT EXISTS idx_ecommerce_orders_delivery_person_id ON ecommerce_orders(delivery_person_id);
        CREATE INDEX IF NOT EXISTS idx_ecommerce_orders_status ON ecommerce_orders(status);
      `);
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
      `);
            return response.status(200).json({
                success: true,
                message: 'Tables ecommerce_orders et ecommerce_order_logs créées avec succès',
            });
        }
        catch (error) {
            logger.error('Erreur création tables ecommerce', {
                error: error.message,
                stack: error.stack,
            });
            return response.status(500).json({
                success: false,
                message: 'Erreur lors de la création des tables',
                error: error.message,
            });
        }
    }
    async store({ request, response, auth }) {
        try {
            const user = auth.user;
            const payload = await request.validateUsing(createOrderValidator);
            const total = payload.produits.reduce((sum, item) => sum + item.prix * item.quantite, 0);
            const vendorId = payload.produits[0].idVendeur;
            const order = await EcommerceOrder.create({
                orderId: randomUUID(),
                status: EcommerceOrderStatus.PENDING,
                clientId: user.id,
                client: user.fullName || user.email,
                phone: user.phone || '',
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
            });
            await EcommerceOrderLog.create({
                logId: randomUUID(),
                orderId: order.orderId,
                oldStatus: '',
                newStatus: EcommerceOrderStatus.PENDING,
                changedBy: user.id,
                changedByRole: user.role,
                reason: null,
            });
            return response.status(201).json({
                success: true,
                orderId: order.orderId,
                status: order.status,
                message: 'Commande créée avec succès',
            });
        }
        catch (error) {
            logger.error('Erreur création commande e-commerce', {
                error: error.message,
                stack: error.stack,
            });
            if (error.messages) {
                return response.status(422).json({
                    success: false,
                    errors: error.messages,
                });
            }
            return response.status(500).json({
                success: false,
                message: 'Erreur lors de la création de la commande',
            });
        }
    }
    async getOrdersByBuyer({ response, auth }) {
        try {
            const user = auth.user;
            const orders = await EcommerceOrder.query()
                .where('clientId', user.id)
                .orderBy('createdAt', 'desc');
            return response.status(200).json({
                success: true,
                commandes: orders,
            });
        }
        catch (error) {
            logger.error('Erreur récupération commandes acheteur', {
                error: error.message,
                stack: error.stack,
            });
            return response.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des commandes',
            });
        }
    }
    async getOrdersByVendor({ response, auth }) {
        try {
            const user = auth.user;
            const orders = await EcommerceOrder.query()
                .where('vendorId', user.id)
                .orderBy('createdAt', 'desc');
            return response.status(200).json({
                success: true,
                commandes: orders,
            });
        }
        catch (error) {
            logger.error('Erreur récupération commandes vendeur', {
                error: error.message,
                stack: error.stack,
            });
            return response.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des commandes',
            });
        }
    }
    async getDeliveriesList({ response }) {
        try {
            const deliveries = await EcommerceOrder.query()
                .whereIn('status', [
                EcommerceOrderStatus.PRET_A_EXPEDIER,
                EcommerceOrderStatus.EN_ROUTE,
                EcommerceOrderStatus.DELIVERED,
            ])
                .orderBy('createdAt', 'desc');
            return response.status(200).json({
                success: true,
                livraison: deliveries,
            });
        }
        catch (error) {
            logger.error('Erreur récupération liste livraisons', {
                error: error.message,
                stack: error.stack,
            });
            return response.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des livraisons',
            });
        }
    }
    async updateStatus({ request, response, auth, params }) {
        try {
            const user = auth.user;
            const { id } = params;
            const payload = await request.validateUsing(updateStatusValidator);
            const order = await EcommerceOrder.findBy('orderId', id);
            if (!order) {
                return response.status(404).json({
                    success: false,
                    message: 'Commande non trouvée',
                });
            }
            const canTransition = this.canTransitionStatus(order.status, payload.status, user.role, user.id, order);
            if (!canTransition.allowed) {
                return response.status(403).json({
                    success: false,
                    message: canTransition.reason,
                });
            }
            if (payload.status === EcommerceOrderStatus.PRET_A_EXPEDIER &&
                !order.packagePhoto) {
                return response.status(400).json({
                    success: false,
                    message: 'Photo du colis obligatoire pour marquer prêt à expédier',
                });
            }
            await EcommerceOrderLog.create({
                logId: randomUUID(),
                orderId: order.orderId,
                oldStatus: order.status,
                newStatus: payload.status,
                changedBy: user.id,
                changedByRole: user.role,
                reason: payload.reason || null,
            });
            const oldStatus = order.status;
            order.status = payload.status;
            await order.save();
            return response.status(200).json({
                success: true,
                order: order,
                message: `Statut mis à jour de "${oldStatus}" vers "${payload.status}"`,
            });
        }
        catch (error) {
            logger.error('Erreur mise à jour statut commande', {
                error: error.message,
                stack: error.stack,
            });
            if (error.messages) {
                return response.status(422).json({
                    success: false,
                    errors: error.messages,
                });
            }
            return response.status(500).json({
                success: false,
                message: 'Erreur lors de la mise à jour du statut',
            });
        }
    }
    async takeDelivery({ response, auth, params }) {
        try {
            const user = auth.user;
            const { orderId } = params;
            if (user.role !== 'livreur') {
                return response.status(403).json({
                    success: false,
                    message: 'Seuls les livreurs peuvent prendre une livraison',
                });
            }
            const order = await EcommerceOrder.findBy('orderId', orderId);
            if (!order) {
                return response.status(404).json({
                    success: false,
                    message: 'Commande non trouvée',
                });
            }
            if (order.status !== EcommerceOrderStatus.PRET_A_EXPEDIER) {
                return response.status(400).json({
                    success: false,
                    message: 'Cette commande n\'est pas prête à être expédiée',
                });
            }
            if (order.deliveryPersonId && order.deliveryPersonId !== user.id) {
                return response.status(400).json({
                    success: false,
                    message: 'Cette commande est déjà assignée à un autre livreur',
                });
            }
            order.deliveryPersonId = user.id;
            order.status = EcommerceOrderStatus.EN_ROUTE;
            await order.save();
            await EcommerceOrderLog.create({
                logId: randomUUID(),
                orderId: order.orderId,
                oldStatus: EcommerceOrderStatus.PRET_A_EXPEDIER,
                newStatus: EcommerceOrderStatus.EN_ROUTE,
                changedBy: user.id,
                changedByRole: user.role,
                reason: null,
            });
            return response.status(200).json({
                success: true,
                order: order,
                message: 'Livraison prise en charge avec succès',
            });
        }
        catch (error) {
            logger.error('Erreur prise en charge livraison', {
                error: error.message,
                stack: error.stack,
            });
            return response.status(500).json({
                success: false,
                message: 'Erreur lors de la prise en charge de la livraison',
            });
        }
    }
    async uploadPackagePhoto({ request, response, auth }) {
        try {
            const user = auth.user;
            const orderId = request.input('orderId');
            if (user.role !== 'vendeur') {
                return response.status(403).json({
                    success: false,
                    message: 'Seuls les vendeurs peuvent uploader une photo',
                });
            }
            const photo = request.file('photo', {
                size: '5mb',
                extnames: ['jpg', 'jpeg', 'png', 'webp'],
            });
            if (!photo || !photo.isValid || !photo.tmpPath) {
                return response.status(400).json({
                    success: false,
                    message: 'Aucune image valide fournie',
                });
            }
            if (!orderId) {
                return response.status(400).json({
                    success: false,
                    message: 'orderId requis',
                });
            }
            const order = await EcommerceOrder.findBy('orderId', orderId);
            if (!order) {
                return response.status(404).json({
                    success: false,
                    message: 'Commande non trouvée',
                });
            }
            if (order.vendorId !== user.id) {
                return response.status(403).json({
                    success: false,
                    message: 'Vous n\'êtes pas autorisé à modifier cette commande',
                });
            }
            if (order.status !== EcommerceOrderStatus.EN_PREPARATION) {
                return response.status(400).json({
                    success: false,
                    message: 'Statut invalide pour upload (doit être "en cours de préparation")',
                });
            }
            if (order.packagePhotoPublicId) {
                await ecommerceCloudinaryService.deletePhoto(order.packagePhotoPublicId);
            }
            const uploadResult = await ecommerceCloudinaryService.uploadPackagePhoto(photo.tmpPath, orderId);
            order.packagePhoto = uploadResult.url;
            order.packagePhotoPublicId = uploadResult.publicId;
            await order.save();
            return response.status(200).json({
                success: true,
                photoUrl: uploadResult.url,
                message: 'Photo uploadée avec succès',
            });
        }
        catch (error) {
            logger.error('Erreur upload photo colis', {
                error: error.message,
                stack: error.stack,
            });
            return response.status(500).json({
                success: false,
                message: 'Erreur lors de l\'upload de la photo',
            });
        }
    }
    canTransitionStatus(currentStatus, newStatus, userRole, userId, order) {
        if (currentStatus === EcommerceOrderStatus.DELIVERED) {
            return { allowed: false, reason: 'La commande est déjà livrée' };
        }
        const transitions = {
            [EcommerceOrderStatus.PENDING]: {
                [EcommerceOrderStatus.EN_PREPARATION]: ['vendeur'],
                [EcommerceOrderStatus.CANCELLED]: ['client', 'vendeur'],
                [EcommerceOrderStatus.REJECTED]: ['vendeur'],
            },
            [EcommerceOrderStatus.EN_PREPARATION]: {
                [EcommerceOrderStatus.PRET_A_EXPEDIER]: ['vendeur'],
                [EcommerceOrderStatus.CANCELLED]: ['client', 'vendeur'],
            },
            [EcommerceOrderStatus.PRET_A_EXPEDIER]: {
                [EcommerceOrderStatus.EN_ROUTE]: ['livreur'],
                [EcommerceOrderStatus.CANCELLED]: ['client', 'vendeur', 'livreur'],
            },
            [EcommerceOrderStatus.EN_ROUTE]: {
                [EcommerceOrderStatus.DELIVERED]: ['livreur'],
                [EcommerceOrderStatus.CANCELLED]: ['livreur'],
            },
        };
        const allowedTransition = transitions[currentStatus]?.[newStatus];
        if (!allowedTransition) {
            return {
                allowed: false,
                reason: `Transition de "${currentStatus}" vers "${newStatus}" non autorisée`,
            };
        }
        if (!allowedTransition.includes(userRole)) {
            return {
                allowed: false,
                reason: `Votre rôle (${userRole}) ne permet pas cette action`,
            };
        }
        if (userRole === 'vendeur' && order.vendorId !== userId) {
            return { allowed: false, reason: 'Vous n\'êtes pas le vendeur de cette commande' };
        }
        if (userRole === 'client' && order.clientId !== userId) {
            return { allowed: false, reason: 'Vous n\'êtes pas le client de cette commande' };
        }
        return { allowed: true };
    }
}
//# sourceMappingURL=ecommerce_orders_controller.js.map