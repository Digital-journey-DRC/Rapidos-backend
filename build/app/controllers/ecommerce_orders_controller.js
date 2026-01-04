import EcommerceOrder, { EcommerceOrderStatus } from '#models/ecommerce_order';
import EcommerceOrderLog from '#models/ecommerce_order_log';
import { createOrderValidator, updateStatusValidator, initializeOrderValidator, updatePaymentMethodValidator, batchUpdatePaymentMethodsValidator } from '#validators/ecommerce_order';
import { randomUUID } from 'node:crypto';
import logger from '@adonisjs/core/services/logger';
import ecommerceCloudinaryService from '#services/ecommerce_cloudinary_service';
import db from '@adonisjs/lucid/services/db';
import PaymentMethod from '#models/payment_method';
import PaymentMethodTemplate from '#models/payment_method_template';
import { DistanceCalculator } from '#services/distance_calculator';
import Product from '#models/product';
import User from '#models/user';
import Media from '#models/media';
import { UserRole } from '../Enum/user_role.js';
import { saveOrderToFirestore, notifyVendors, updateOrderInFirestore, admin } from '#services/firebase_service';
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
            let paymentMethodId = null;
            if (payload.paymentMethodId) {
                const paymentMethod = await PaymentMethod.find(payload.paymentMethodId);
                if (!paymentMethod) {
                    return response.status(404).json({
                        success: false,
                        message: 'Moyen de paiement non trouvé',
                    });
                }
                if (paymentMethod.vendeurId !== vendorId) {
                    return response.status(403).json({
                        success: false,
                        message: 'Le moyen de paiement sélectionné n\'appartient pas au vendeur de cette commande',
                    });
                }
                if (!paymentMethod.isActive) {
                    return response.status(400).json({
                        success: false,
                        message: 'Le moyen de paiement sélectionné n\'est pas actif',
                    });
                }
                paymentMethodId = paymentMethod.id;
            }
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
                paymentMethodId: paymentMethodId,
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
            if (paymentMethodId) {
                await order.load('paymentMethod');
            }
            let formattedPaymentMethod = null;
            if (order.paymentMethod) {
                const template = await PaymentMethodTemplate.query()
                    .where('type', order.paymentMethod.type)
                    .first();
                formattedPaymentMethod = {
                    id: order.paymentMethod.id,
                    type: order.paymentMethod.type,
                    numeroCompte: order.paymentMethod.numeroCompte,
                    nomTitulaire: order.paymentMethod.nomTitulaire,
                    isDefault: order.paymentMethod.isDefault,
                    isActive: order.paymentMethod.isActive,
                    imageUrl: template?.imageUrl || null,
                    name: template?.name || order.paymentMethod.type,
                };
            }
            return response.status(201).json({
                success: true,
                orderId: order.orderId,
                status: order.status,
                paymentMethod: formattedPaymentMethod,
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
    async getOrdersByBuyer({ request, response, auth }) {
        try {
            const user = auth.user;
            const status = request.input('status');
            const query = EcommerceOrder.query()
                .where('client_id', user.id)
                .preload('paymentMethod')
                .orderBy('createdAt', 'desc');
            if (status) {
                query.where('status', status);
            }
            const orders = await query;
            const templates = await PaymentMethodTemplate.query();
            const templatesMap = new Map(templates.map(t => [t.type, t]));
            const formattedOrders = orders.map((order) => {
                const serialized = order.serialize();
                const paymentMethod = order.paymentMethod
                    ? (() => {
                        const template = templatesMap.get(order.paymentMethod.type);
                        return {
                            id: order.paymentMethod.id,
                            type: order.paymentMethod.type,
                            numeroCompte: order.paymentMethod.numeroCompte,
                            nomTitulaire: order.paymentMethod.nomTitulaire,
                            isDefault: order.paymentMethod.isDefault,
                            isActive: order.paymentMethod.isActive,
                            imageUrl: template?.imageUrl || null,
                            name: template?.name || order.paymentMethod.type,
                        };
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
                    };
                return {
                    ...serialized,
                    paymentMethod,
                };
            });
            return response.status(200).json({
                success: true,
                commandes: formattedOrders,
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
                .where('vendor_id', user.id)
                .where('status', '!=', EcommerceOrderStatus.PENDING_PAYMENT)
                .preload('paymentMethod')
                .preload('clientUser')
                .orderBy('createdAt', 'desc');
            const templates = await PaymentMethodTemplate.query();
            const templatesMap = new Map(templates.map(t => [t.type, t]));
            const formattedOrders = orders.map((order) => {
                const serialized = order.serialize();
                const paymentMethod = order.paymentMethod
                    ? (() => {
                        const template = templatesMap.get(order.paymentMethod.type);
                        return {
                            id: order.paymentMethod.id,
                            type: order.paymentMethod.type,
                            numeroCompte: order.paymentMethod.numeroCompte,
                            nomTitulaire: order.paymentMethod.nomTitulaire,
                            isDefault: order.paymentMethod.isDefault,
                            isActive: order.paymentMethod.isActive,
                            imageUrl: template?.imageUrl || null,
                            name: template?.name || order.paymentMethod.type,
                        };
                    })()
                    : null;
                return {
                    ...serialized,
                    clientName: order.clientUser
                        ? `${order.clientUser.firstName || ''} ${order.clientUser.lastName || ''}`.trim()
                        : serialized.client,
                    clientPhone: order.clientUser?.phone || serialized.phone,
                    paymentMethod,
                };
            });
            return response.status(200).json({
                success: true,
                commandes: formattedOrders,
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
                .preload('paymentMethod')
                .preload('vendor')
                .preload('clientUser')
                .orderBy('createdAt', 'desc');
            const formattedDeliveries = deliveries.map((order) => {
                const serialized = order.serialize();
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
                };
            });
            return response.status(200).json({
                success: true,
                livraison: formattedDeliveries,
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
            const order = await EcommerceOrder.find(id);
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
            if (payload.status === EcommerceOrderStatus.PRET_A_EXPEDIER) {
                if (!order.packagePhoto || !order.codeColis) {
                    return response.status(400).json({
                        success: false,
                        message: 'Photo du colis et code obligatoires pour marquer prêt à expédier. Utilisez l\'endpoint /upload-package-photo d\'abord.',
                    });
                }
            }
            if (payload.status === EcommerceOrderStatus.EN_ROUTE) {
                if (!order.deliveryPersonId || order.deliveryPersonId !== user.id) {
                    return response.status(403).json({
                        success: false,
                        message: 'Cette commande ne vous est pas assignée.',
                    });
                }
                const codeColis = request.input('codeColis');
                if (!codeColis) {
                    return response.status(400).json({
                        success: false,
                        message: 'Le code du colis est requis pour marquer en route.',
                    });
                }
                if (codeColis !== order.codeColis) {
                    return response.status(400).json({
                        success: false,
                        message: 'Code du colis incorrect. Vérifiez avec le vendeur.',
                    });
                }
                let newCodeColis;
                let isUnique = false;
                let attempts = 0;
                const maxAttempts = 100;
                while (!isUnique && attempts < maxAttempts) {
                    newCodeColis = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
                    const existingOrder = await EcommerceOrder.query()
                        .where('code_colis', newCodeColis)
                        .andWhere('id', '!=', order.id)
                        .first();
                    if (!existingOrder) {
                        isUnique = true;
                    }
                    attempts++;
                }
                if (!isUnique) {
                    return response.status(500).json({
                        success: false,
                        message: 'Impossible de générer un nouveau code. Veuillez réessayer.',
                    });
                }
                order.codeColis = newCodeColis;
            }
            if (payload.status === EcommerceOrderStatus.DELIVERED) {
                const codeColis = request.input('codeColis');
                if (!codeColis) {
                    return response.status(400).json({
                        success: false,
                        message: 'Le code de confirmation est requis pour marquer comme livré.',
                    });
                }
                if (codeColis !== order.codeColis) {
                    return response.status(400).json({
                        success: false,
                        message: 'Code de confirmation incorrect.',
                    });
                }
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
            if (payload.status === EcommerceOrderStatus.PRET_A_EXPEDIER && order.firebaseOrderId) {
                await updateOrderInFirestore(order.firebaseOrderId, {
                    status: 'pret_a_expedier',
                    packagePhoto: order.packagePhoto,
                });
            }
            await order.load('paymentMethod');
            const formattedPaymentMethod = order.paymentMethod
                ? {
                    id: order.paymentMethod.id,
                    type: order.paymentMethod.type,
                    numeroCompte: order.paymentMethod.numeroCompte,
                    nomTitulaire: order.paymentMethod.nomTitulaire,
                    isDefault: order.paymentMethod.isDefault,
                    isActive: order.paymentMethod.isActive,
                }
                : null;
            const serializedOrder = order.serialize();
            const formattedOrder = {
                ...serializedOrder,
                paymentMethod: formattedPaymentMethod,
            };
            let message = `Statut mis à jour de "${oldStatus}" vers "${payload.status}"`;
            const responseData = {
                success: true,
                order: formattedOrder,
                message: message,
            };
            if (payload.status === EcommerceOrderStatus.EN_ROUTE && order.codeColis) {
                responseData.newCodeColis = order.codeColis;
                responseData.message = `${message}. Nouveau code de confirmation généré : ${order.codeColis}`;
            }
            return response.status(200).json(responseData);
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
    async getAvailableDeliveries({ response, auth }) {
        try {
            const user = auth.user;
            if (user.role !== 'livreur') {
                return response.status(403).json({
                    success: false,
                    message: 'Seuls les livreurs peuvent consulter les livraisons disponibles',
                });
            }
            const deliveries = await EcommerceOrder.query()
                .where('status', EcommerceOrderStatus.PRET_A_EXPEDIER)
                .whereNull('deliveryPersonId')
                .preload('paymentMethod')
                .orderBy('createdAt', 'desc');
            const templates = await PaymentMethodTemplate.query();
            const templatesMap = new Map(templates.map(t => [t.type, t]));
            const formattedDeliveries = deliveries.map((order) => {
                const serialized = order.serialize();
                const paymentMethod = order.paymentMethod
                    ? (() => {
                        const template = templatesMap.get(order.paymentMethod.type);
                        return {
                            id: order.paymentMethod.id,
                            type: order.paymentMethod.type,
                            numeroCompte: order.paymentMethod.numeroCompte,
                            nomTitulaire: order.paymentMethod.nomTitulaire,
                            isDefault: order.paymentMethod.isDefault,
                            isActive: order.paymentMethod.isActive,
                            imageUrl: template?.imageUrl || null,
                            name: template?.name || order.paymentMethod.type,
                        };
                    })()
                    : null;
                return {
                    ...serialized,
                    paymentMethod,
                };
            });
            return response.status(200).json({
                success: true,
                message: 'Livraisons disponibles récupérées avec succès',
                livraisons: formattedDeliveries,
            });
        }
        catch (error) {
            logger.error('Erreur récupération livraisons disponibles', {
                error: error.message,
                stack: error.stack,
            });
            return response.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des livraisons disponibles',
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
            order.status = EcommerceOrderStatus.ACCEPTE_LIVREUR;
            await order.save();
            await EcommerceOrderLog.create({
                logId: randomUUID(),
                orderId: order.orderId,
                oldStatus: EcommerceOrderStatus.PRET_A_EXPEDIER,
                newStatus: EcommerceOrderStatus.ACCEPTE_LIVREUR,
                changedBy: user.id,
                changedByRole: user.role,
                reason: 'Livraison acceptée par le livreur',
            });
            await order.load('paymentMethod');
            const formattedPaymentMethod = order.paymentMethod
                ? {
                    id: order.paymentMethod.id,
                    type: order.paymentMethod.type,
                    numeroCompte: order.paymentMethod.numeroCompte,
                    nomTitulaire: order.paymentMethod.nomTitulaire,
                    isDefault: order.paymentMethod.isDefault,
                    isActive: order.paymentMethod.isActive,
                }
                : null;
            const serializedOrder = order.serialize();
            const formattedOrder = {
                ...serializedOrder,
                paymentMethod: formattedPaymentMethod,
            };
            return response.status(200).json({
                success: true,
                order: formattedOrder,
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
    canTransitionStatus(currentStatus, newStatus, userRole, userId, order) {
        if (currentStatus === EcommerceOrderStatus.DELIVERED) {
            return { allowed: false, reason: 'La commande est déjà livrée' };
        }
        const transitions = {
            [EcommerceOrderStatus.PENDING_PAYMENT]: {
                [EcommerceOrderStatus.PENDING]: ['acheteur', 'vendeur'],
                [EcommerceOrderStatus.CANCELLED]: ['acheteur', 'vendeur'],
            },
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
                [EcommerceOrderStatus.ACCEPTE_LIVREUR]: ['livreur'],
                [EcommerceOrderStatus.CANCELLED]: ['client', 'vendeur', 'livreur'],
            },
            [EcommerceOrderStatus.ACCEPTE_LIVREUR]: {
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
    async initialize({ request, response, auth }) {
        try {
            const user = auth.user;
            const payload = await request.validateUsing(initializeOrderValidator);
            const productIds = payload.products.map(p => p.productId);
            const products = await Product.query().whereIn('id', productIds);
            const allMedias = await Media.query()
                .whereIn('product_id', productIds)
                .orderBy('created_at', 'asc');
            const mediasByProduct = new Map();
            for (const media of allMedias) {
                if (!mediasByProduct.has(media.productId)) {
                    mediasByProduct.set(media.productId, []);
                }
                mediasByProduct.get(media.productId).push(media);
            }
            if (products.length !== productIds.length) {
                return response.status(404).json({
                    success: false,
                    message: 'Un ou plusieurs produits n\'existent pas',
                });
            }
            const quantityMap = new Map(payload.products.map(p => [p.productId, p.quantite]));
            const productsByVendor = new Map();
            for (const product of products) {
                const vendorId = product.vendeurId;
                const quantite = quantityMap.get(product.id);
                if (!productsByVendor.has(vendorId)) {
                    productsByVendor.set(vendorId, []);
                }
                productsByVendor.get(vendorId).push({ product, quantite });
            }
            const vendorIds = Array.from(productsByVendor.keys());
            const vendors = await User.query().whereIn('id', vendorIds);
            const vendorMap = new Map(vendors.map(v => [v.id, v]));
            const createdOrders = [];
            for (const [vendorId, vendorProducts] of productsByVendor) {
                const vendor = vendorMap.get(vendorId);
                if (!vendor) {
                    logger.warn(`Vendeur ${vendorId} non trouvé`);
                    continue;
                }
                if (!vendor.latitude || !vendor.longitude) {
                    return response.status(400).json({
                        success: false,
                        message: `Le vendeur ${vendor.firstName} ${vendor.lastName} n'a pas de position GPS enregistrée`,
                    });
                }
                const distance = DistanceCalculator.calculateDistance({ latitude: payload.latitude, longitude: payload.longitude }, { latitude: vendor.latitude, longitude: vendor.longitude });
                const deliveryFee = DistanceCalculator.calculateDeliveryFee(distance);
                const totalProduits = vendorProducts.reduce((sum, { product, quantite }) => sum + product.price * quantite, 0);
                const order = await EcommerceOrder.create({
                    orderId: randomUUID(),
                    status: EcommerceOrderStatus.PENDING_PAYMENT,
                    clientId: user.id,
                    client: user.fullName || user.email,
                    phone: user.phone || '',
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
                });
                await EcommerceOrderLog.create({
                    logId: randomUUID(),
                    orderId: order.orderId,
                    oldStatus: '',
                    newStatus: EcommerceOrderStatus.PENDING_PAYMENT,
                    changedBy: user.id,
                    changedByRole: user.role,
                    reason: 'Initialisation de la commande',
                });
                let paymentMethodData = null;
                if (order.paymentMethodId) {
                    await order.load('paymentMethod');
                    await order.refresh();
                    const template = await PaymentMethodTemplate.query()
                        .where('type', order.paymentMethod.type)
                        .first();
                    paymentMethodData = {
                        id: order.paymentMethod.id,
                        type: order.paymentMethod.type,
                        name: template?.name || order.paymentMethod.type,
                        imageUrl: template?.imageUrl || null,
                        numeroCompte: order.paymentMethod.numeroCompte,
                    };
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
                        const productMedias = mediasByProduct.get(product.id) || [];
                        const mainImage = productMedias.length > 0 ? productMedias[0].mediaUrl : null;
                        const secondaryImages = productMedias.length > 1
                            ? productMedias.slice(1).map(m => m.mediaUrl)
                            : [];
                        return {
                            id: product.id,
                            name: product.name,
                            prix: product.price,
                            quantite: quantite,
                            imageUrl: mainImage,
                            images: secondaryImages,
                        };
                    }),
                    totalProduits: totalProduits,
                    deliveryFee: order.deliveryFee,
                    distanceKm: order.distanceKm,
                    totalAvecLivraison: totalProduits + order.deliveryFee,
                    status: order.status,
                    address: order.address,
                    latitude: order.latitude,
                    longitude: order.longitude,
                    paymentMethod: paymentMethodData,
                    createdAt: order.createdAt,
                });
            }
            const summary = {
                totalOrders: createdOrders.length,
                totalProducts: createdOrders.reduce((sum, o) => sum + o.totalProduits, 0),
                totalDelivery: createdOrders.reduce((sum, o) => sum + o.deliveryFee, 0),
                grandTotal: createdOrders.reduce((sum, o) => sum + o.totalAvecLivraison, 0),
            };
            return response.status(201).json({
                success: true,
                message: 'Commandes initialisées avec succès',
                orders: createdOrders,
                summary: summary,
            });
        }
        catch (error) {
            logger.error('Erreur lors de l\'initialisation des commandes:', error);
            return response.status(500).json({
                success: false,
                message: 'Erreur lors de l\'initialisation des commandes',
                error: error.message,
            });
        }
    }
    async getBuyerOrders({ request, response, auth }) {
        try {
            const user = auth.user;
            const { status, vendeurId } = request.qs();
            const latestOrder = await EcommerceOrder.query()
                .where('client_id', user.id)
                .orderBy('created_at', 'desc')
                .first();
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
                });
            }
            const allOrders = await EcommerceOrder.query()
                .where('client_id', user.id)
                .preload('paymentMethod')
                .orderBy('created_at', 'desc');
            const latestMs = latestOrder.createdAt.toMillis();
            const tenSecondsAgo = latestMs - 10000;
            const tenSecondsAfter = latestMs + 10000;
            let orders = allOrders.filter((order) => {
                const orderMs = order.createdAt.toMillis();
                return orderMs >= tenSecondsAgo && orderMs <= tenSecondsAfter;
            });
            const filteredOrders = status
                ? orders.filter(o => o.status === status)
                : orders;
            const finalOrders = vendeurId
                ? filteredOrders.filter(o => o.vendorId === Number(vendeurId))
                : filteredOrders;
            const enrichedOrders = await Promise.all(finalOrders.map(async (order) => {
                const vendor = await User.find(order.vendorId);
                let formattedPaymentMethod = null;
                if (order.paymentMethod) {
                    const template = await PaymentMethodTemplate.query()
                        .where('type', order.paymentMethod.type)
                        .first();
                    formattedPaymentMethod = {
                        id: order.paymentMethod.id,
                        type: order.paymentMethod.type,
                        name: template?.name || order.paymentMethod.type,
                        imageUrl: template?.imageUrl || null,
                        numeroCompte: order.paymentMethod.numeroCompte,
                        nomTitulaire: order.paymentMethod.nomTitulaire,
                        isDefault: order.paymentMethod.isDefault,
                        isActive: order.paymentMethod.isActive,
                    };
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
                };
            }));
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
            };
            return response.status(200).json({
                success: true,
                message: 'Vos commandes récupérées avec succès',
                orders: enrichedOrders,
                stats: stats,
            });
        }
        catch (error) {
            logger.error('Erreur lors de la récupération des commandes de l\'acheteur:', error);
            return response.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération de vos commandes',
                error: error.message,
            });
        }
    }
    async updatePaymentMethod({ request, response, auth, params }) {
        try {
            const user = auth.user;
            const orderId = params.id;
            const payload = await request.validateUsing(updatePaymentMethodValidator);
            const order = await EcommerceOrder.find(orderId);
            if (!order) {
                return response.status(404).json({
                    success: false,
                    message: 'Commande non trouvée',
                });
            }
            if (order.clientId !== user.id) {
                return response.status(403).json({
                    success: false,
                    message: 'Vous n\'êtes pas autorisé à modifier cette commande',
                });
            }
            if (order.status !== EcommerceOrderStatus.PENDING_PAYMENT) {
                return response.status(400).json({
                    success: false,
                    message: 'Impossible de modifier le moyen de paiement. La commande n\'est plus en attente de paiement.',
                });
            }
            const newPaymentMethod = await PaymentMethod.find(payload.paymentMethodId);
            if (!newPaymentMethod) {
                return response.status(404).json({
                    success: false,
                    message: 'Moyen de paiement non trouvé',
                });
            }
            if (newPaymentMethod.vendeurId !== order.vendorId) {
                return response.status(403).json({
                    success: false,
                    message: 'Le moyen de paiement sélectionné n\'appartient pas au vendeur de cette commande',
                });
            }
            if (!newPaymentMethod.isActive) {
                return response.status(400).json({
                    success: false,
                    message: 'Le moyen de paiement sélectionné n\'est pas actif',
                });
            }
            order.paymentMethodId = newPaymentMethod.id;
            if (payload.numeroPayment) {
                order.numeroPayment = payload.numeroPayment;
            }
            let firebaseOrderId = null;
            if (order.status === EcommerceOrderStatus.PENDING_PAYMENT) {
                order.status = EcommerceOrderStatus.PENDING;
                await EcommerceOrderLog.create({
                    logId: randomUUID(),
                    orderId: order.orderId,
                    oldStatus: EcommerceOrderStatus.PENDING_PAYMENT,
                    newStatus: EcommerceOrderStatus.PENDING,
                    changedBy: user.id,
                    changedByRole: user.role,
                    reason: 'Moyen de paiement confirmé',
                });
                await order.save();
                await order.load('clientUser');
                const enrichedItems = await Promise.all(order.items.map(async (item) => {
                    const product = await Product.query()
                        .where('id', item.productId)
                        .preload('media')
                        .preload('category')
                        .first();
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
                    };
                }));
                const addr = order.address;
                const adresseComplete = `${addr.avenue}, ${addr.numero}, ${addr.quartier}, ${addr.ville}, ${addr.pays}`;
                const cartOrder = {
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    status: 'pending',
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
                };
                firebaseOrderId = await saveOrderToFirestore(cartOrder);
                order.firebaseOrderId = firebaseOrderId;
                await order.save();
                await notifyVendors(enrichedItems, order.client, firebaseOrderId);
            }
            else {
                await order.save();
            }
            await order.load('paymentMethod');
            const template = await PaymentMethodTemplate.query()
                .where('type', order.paymentMethod.type)
                .first();
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
                        id: order.paymentMethod.id,
                        type: order.paymentMethod.type,
                        name: template?.name || order.paymentMethod.type,
                        imageUrl: template?.imageUrl || null,
                        numeroCompte: order.paymentMethod.numeroCompte,
                    },
                    updatedAt: order.updatedAt,
                },
            });
        }
        catch (error) {
            logger.error('Erreur lors de la modification du moyen de paiement:', error);
            return response.status(500).json({
                success: false,
                message: 'Erreur lors de la modification du moyen de paiement',
                error: error.message,
            });
        }
    }
    async batchUpdatePaymentMethods({ request, response, auth }) {
        const trx = await db.transaction();
        try {
            const user = auth.user;
            const payload = await request.validateUsing(batchUpdatePaymentMethodsValidator);
            const commandeIds = payload.updates.map(u => u.commandeId);
            const orders = await EcommerceOrder.query()
                .whereIn('id', commandeIds)
                .where('client_id', user.id)
                .useTransaction(trx);
            if (orders.length !== commandeIds.length) {
                await trx.rollback();
                return response.status(404).json({
                    success: false,
                    message: 'Une ou plusieurs commandes n\'existent pas ou ne vous appartiennent pas',
                });
            }
            const notPendingOrders = orders.filter(o => o.status !== EcommerceOrderStatus.PENDING_PAYMENT);
            if (notPendingOrders.length > 0) {
                await trx.rollback();
                return response.status(400).json({
                    success: false,
                    message: 'Certaines commandes ne sont plus modifiables (statut différent de pending_payment)',
                    orderIds: notPendingOrders.map(o => o.id),
                });
            }
            const orderMap = new Map(orders.map(o => [o.id, o]));
            const paymentMethodIds = payload.updates.map(u => u.paymentMethodId);
            const paymentMethods = await PaymentMethod.query()
                .whereIn('id', paymentMethodIds)
                .useTransaction(trx);
            const paymentMethodMap = new Map(paymentMethods.map(pm => [pm.id, pm]));
            const updatedOrders = [];
            for (const update of payload.updates) {
                const order = orderMap.get(update.commandeId);
                const paymentMethod = paymentMethodMap.get(update.paymentMethodId);
                if (!paymentMethod) {
                    await trx.rollback();
                    return response.status(404).json({
                        success: false,
                        message: `Le moyen de paiement ${update.paymentMethodId} n'existe pas`,
                        commandeId: update.commandeId,
                    });
                }
                if (paymentMethod.vendeurId !== order.vendorId) {
                    await trx.rollback();
                    return response.status(403).json({
                        success: false,
                        message: `Le moyen de paiement ${update.paymentMethodId} n'appartient pas au vendeur de la commande ${update.commandeId}`,
                    });
                }
                if (!paymentMethod.isActive) {
                    await trx.rollback();
                    return response.status(400).json({
                        success: false,
                        message: `Le moyen de paiement ${update.paymentMethodId} n'est pas actif`,
                        commandeId: update.commandeId,
                    });
                }
                order.paymentMethodId = paymentMethod.id;
                if (update.numeroPayment) {
                    order.numeroPayment = update.numeroPayment;
                }
                if (order.status === EcommerceOrderStatus.PENDING_PAYMENT) {
                    order.status = EcommerceOrderStatus.PENDING;
                    await EcommerceOrderLog.create({
                        logId: randomUUID(),
                        orderId: order.orderId,
                        oldStatus: EcommerceOrderStatus.PENDING_PAYMENT,
                        newStatus: EcommerceOrderStatus.PENDING,
                        changedBy: user.id,
                        changedByRole: user.role,
                        reason: 'Moyen de paiement confirmé (batch)',
                    }, { client: trx });
                }
                await order.useTransaction(trx).save();
                updatedOrders.push({
                    commandeId: order.id,
                    orderId: order.orderId,
                    vendeurId: order.vendorId,
                    oldPaymentMethodId: order.paymentMethodId,
                    newPaymentMethodId: paymentMethod.id,
                });
            }
            await trx.commit();
            const firebaseOrderIds = [];
            for (const order of orders) {
                if (order.status === EcommerceOrderStatus.PENDING) {
                    await order.load('clientUser');
                    const enrichedItems = await Promise.all(order.items.map(async (item) => {
                        const product = await Product.query()
                            .where('id', item.productId)
                            .preload('media')
                            .preload('category')
                            .first();
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
                        };
                    }));
                    const addr = order.address;
                    const adresseComplete = `${addr.avenue}, ${addr.numero}, ${addr.quartier}, ${addr.ville}, ${addr.pays}`;
                    const cartOrder = {
                        timestamp: admin.firestore.FieldValue.serverTimestamp(),
                        status: 'pending',
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
                    };
                    const firebaseOrderId = await saveOrderToFirestore(cartOrder);
                    firebaseOrderIds.push({ commandeId: order.id, firebaseOrderId });
                    order.firebaseOrderId = firebaseOrderId;
                    await order.save();
                    await notifyVendors(enrichedItems, order.client, firebaseOrderId);
                }
            }
            const finalOrders = await EcommerceOrder.query()
                .whereIn('id', commandeIds)
                .preload('paymentMethod');
            const enrichedOrders = await Promise.all(finalOrders.map(async (order) => {
                const template = await PaymentMethodTemplate.query()
                    .where('type', order.paymentMethod.type)
                    .first();
                const firebaseInfo = firebaseOrderIds.find(f => f.commandeId === order.id);
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
                        id: order.paymentMethod.id,
                        type: order.paymentMethod.type,
                        name: template?.name || order.paymentMethod.type,
                        imageUrl: template?.imageUrl || null,
                        numeroCompte: order.paymentMethod.numeroCompte,
                    },
                    updatedAt: order.updatedAt,
                };
            }));
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
            });
        }
        catch (error) {
            await trx.rollback();
            logger.error('Erreur lors de la modification batch des moyens de paiement:', error);
            return response.status(500).json({
                success: false,
                message: 'Erreur lors de la modification des moyens de paiement',
                error: error.message,
            });
        }
    }
    async uploadPackagePhoto({ request, response, params, auth }) {
        try {
            const user = auth.user;
            const orderId = params.orderId;
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
                    message: 'Seul le vendeur de cette commande peut uploader la photo du colis',
                });
            }
            if (order.status !== EcommerceOrderStatus.EN_PREPARATION) {
                return response.status(400).json({
                    success: false,
                    message: 'La photo du colis ne peut être uploadée que lorsque la commande est en préparation',
                });
            }
            const packagePhoto = request.file('packagePhoto', {
                size: '10mb',
                extnames: ['jpg', 'jpeg', 'png', 'webp'],
            });
            if (!packagePhoto) {
                return response.status(400).json({
                    success: false,
                    message: 'Aucune photo fournie. Le champ doit être nommé "packagePhoto"',
                });
            }
            if (!packagePhoto.isValid || !packagePhoto.tmpPath) {
                logger.error('Fichier invalide lors de l\'upload', {
                    isValid: packagePhoto.isValid,
                    tmpPath: packagePhoto.tmpPath,
                    errors: packagePhoto.errors,
                });
                return response.status(400).json({
                    success: false,
                    message: 'Fichier invalide',
                    errors: packagePhoto.errors,
                });
            }
            const fs = await import('fs/promises');
            try {
                await fs.access(packagePhoto.tmpPath);
            }
            catch (error) {
                logger.error('Fichier temporaire non accessible', {
                    tmpPath: packagePhoto.tmpPath,
                    error: error.message,
                });
                return response.status(500).json({
                    success: false,
                    message: 'Erreur: fichier temporaire non accessible',
                    error: error.message,
                });
            }
            if (order.packagePhotoPublicId) {
                try {
                    await ecommerceCloudinaryService.deletePhoto(order.packagePhotoPublicId);
                }
                catch (error) {
                    logger.warn('Erreur lors de la suppression de l\'ancienne photo du colis:', error);
                }
            }
            let uploadResult;
            try {
                uploadResult = await ecommerceCloudinaryService.uploadPackagePhoto(packagePhoto.tmpPath, order.orderId);
            }
            catch (error) {
                logger.error('Erreur lors de l\'upload Cloudinary', {
                    tmpPath: packagePhoto.tmpPath,
                    orderId: order.orderId,
                    error: error.message,
                    stack: error.stack,
                });
                return response.status(500).json({
                    success: false,
                    message: 'Erreur lors de l\'upload de la photo sur Cloudinary',
                    error: error.message,
                });
            }
            let codeColis;
            let isUnique = false;
            let attempts = 0;
            const maxAttempts = 100;
            while (!isUnique && attempts < maxAttempts) {
                codeColis = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
                const existingOrder = await EcommerceOrder.query()
                    .where('code_colis', codeColis)
                    .where('id', '!=', order.id)
                    .first();
                if (!existingOrder) {
                    isUnique = true;
                }
                attempts++;
            }
            if (!isUnique) {
                return response.status(500).json({
                    success: false,
                    message: 'Impossible de générer un code unique. Veuillez réessayer.',
                });
            }
            order.packagePhoto = uploadResult.url;
            order.packagePhotoPublicId = uploadResult.publicId;
            order.codeColis = codeColis;
            await order.save();
            return response.status(200).json({
                success: true,
                message: 'Photo du colis uploadée et code généré avec succès',
                data: {
                    orderId: order.orderId,
                    packagePhoto: order.packagePhoto,
                    codeColis: order.codeColis,
                },
            });
        }
        catch (error) {
            logger.error('Erreur lors de l\'upload de la photo du colis:', error);
            return response.status(500).json({
                success: false,
                message: 'Erreur lors de l\'upload de la photo',
                error: error.message,
            });
        }
    }
    async getAllOrders({ request, response, auth }) {
        try {
            const user = auth.user;
            if (user.role !== UserRole.ADMIN && user.role !== UserRole.SuperAdmin) {
                return response.forbidden({
                    success: false,
                    message: 'Seuls les administrateurs peuvent consulter toutes les commandes',
                });
            }
            const page = request.input('page', 1);
            const limit = request.input('limit', 20);
            const status = request.input('status');
            const vendorId = request.input('vendor_id');
            const clientId = request.input('client_id');
            let query = EcommerceOrder.query()
                .preload('paymentMethod')
                .orderBy('createdAt', 'desc');
            if (status) {
                query = query.where('status', status);
            }
            if (vendorId) {
                query = query.where('vendor_id', vendorId);
            }
            if (clientId) {
                query = query.where('client_id', clientId);
            }
            const orders = await query.paginate(page, limit);
            const templates = await PaymentMethodTemplate.query();
            const templatesMap = new Map(templates.map(t => [t.type, t]));
            const formattedOrders = orders.all().map((order) => {
                const serialized = order.serialize();
                const paymentMethod = order.paymentMethod
                    ? (() => {
                        const template = templatesMap.get(order.paymentMethod.type);
                        return {
                            id: order.paymentMethod.id,
                            type: order.paymentMethod.type,
                            numeroCompte: order.paymentMethod.numeroCompte,
                            nomTitulaire: order.paymentMethod.nomTitulaire,
                            isDefault: order.paymentMethod.isDefault,
                            isActive: order.paymentMethod.isActive,
                            imageUrl: template?.imageUrl || null,
                            name: template?.name || order.paymentMethod.type,
                        };
                    })()
                    : null;
                return {
                    ...serialized,
                    paymentMethod,
                };
            });
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
            });
        }
        catch (error) {
            logger.error('Erreur récupération toutes les commandes (admin)', {
                error: error.message,
                stack: error.stack,
            });
            return response.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des commandes',
                error: error.message,
            });
        }
    }
}
//# sourceMappingURL=ecommerce_orders_controller.js.map