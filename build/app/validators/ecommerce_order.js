import vine from '@vinejs/vine';
export const createOrderValidator = vine.compile(vine.object({
    produits: vine.array(vine.object({
        id: vine.number(),
        nom: vine.string(),
        prix: vine.number(),
        quantite: vine.number().min(1),
        idVendeur: vine.number(),
    })),
    ville: vine.string().trim().minLength(2),
    commune: vine.string().trim().minLength(2),
    quartier: vine.string().trim().minLength(2),
    avenue: vine.string().trim(),
    numero: vine.string().trim(),
    pays: vine.string().trim().minLength(2),
    codePostale: vine.string().trim(),
    paymentMethodId: vine.number().optional(),
}));
export const updateStatusValidator = vine.compile(vine.object({
    status: vine.enum([
        'pending_payment',
        'pending',
        'colis en cours de préparation',
        'prêt à expédier',
        'accepté par livreur',
        'en route pour livraison',
        'delivered',
        'cancelled',
        'rejected',
        'en_preparation',
        'pret_a_expedier',
        'accepte_livreur',
        'en_route',
    ]),
    reason: vine.string().trim().optional(),
}));
export const initializeOrderValidator = vine.compile(vine.object({
    products: vine.array(vine.object({
        productId: vine.number().positive(),
        quantite: vine.number().positive().min(1),
    })).minLength(1),
    latitude: vine.number().min(-90).max(90),
    longitude: vine.number().min(-180).max(180),
    address: vine.object({
        pays: vine.string().trim().optional(),
        ville: vine.string().trim().optional(),
        commune: vine.string().trim().optional(),
        quartier: vine.string().trim().optional(),
        avenue: vine.string().trim().optional(),
        numero: vine.string().trim().optional(),
        codePostale: vine.string().trim().optional(),
        refAdresse: vine.string().trim().optional(),
    }).optional(),
}));
export const updatePaymentMethodValidator = vine.compile(vine.object({
    paymentMethodId: vine.number().positive(),
    numeroPayment: vine.string().trim().optional(),
}));
export const batchUpdatePaymentMethodsValidator = vine.compile(vine.object({
    updates: vine.array(vine.object({
        commandeId: vine.number().positive(),
        paymentMethodId: vine.number().positive(),
        numeroPayment: vine.string().trim().optional(),
    })).minLength(1),
}));
//# sourceMappingURL=ecommerce_order.js.map