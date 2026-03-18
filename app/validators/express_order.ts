import vine from '@vinejs/vine'

/**
 * Validator pour l'initialisation d'une commande express par le vendeur
 */
export const initializeExpressOrderValidator = vine.compile(
  vine.object({
    clientId: vine.number().positive(),
    items: vine.array(
      vine.object({
        productId: vine.number().positive().optional(),
        name: vine.string().trim(),
        description: vine.string().trim().optional(),
        price: vine.number().positive().optional(),
        quantity: vine.number().positive().min(1),
        weight: vine.string().trim().optional(),
        urlProduct: vine.string().trim().optional(),
      })
    ).minLength(1),
    packageValue: vine.number().positive(),
    packageDescription: vine.string().trim(),
    pickupAddress: vine.string().trim().optional(),
    deliveryAddress: vine.string().trim().optional(),
    pickupReference: vine.string().trim().optional(),
    deliveryReference: vine.string().trim().optional(),
    latitude: vine.number().min(-90).max(90).optional(),
    longitude: vine.number().min(-180).max(180).optional(),
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
  })
)

/**
 * Validator pour la modification du moyen de paiement
 */
export const updateExpressPaymentMethodValidator = vine.compile(
  vine.object({
    paymentMethodId: vine.number().positive(),
    numeroPayment: vine.string().trim().optional(),
  })
)

/**
 * Validator pour la modification du statut
 */
export const updateExpressStatusValidator = vine.compile(
  vine.object({
    status: vine.enum([
      'pending_payment',
      'pending',
      'en_preparation',
      'pret_a_expedier',
      'accepte_livreur',
      'en_route',
      'delivered',
      'cancelled',
      'rejected',
    ]),
    reason: vine.string().trim().optional(),
    codeColis: vine.string().trim().optional(),
  })
)

/**
 * Validator pour l'enregistrement d'un client express
 */
export const createExpressClientValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2),
    phone: vine.string().trim().minLength(10),
    email: vine.string().trim().email().optional(),
    defaultAddress: vine.string().trim().optional(),
    defaultReference: vine.string().trim().optional(),
    pays: vine.string().trim().optional(),
    province: vine.string().trim().optional(),
    ville: vine.string().trim().optional(),
    commune: vine.string().trim().optional(),
    avenue: vine.string().trim().optional(),
    latitude: vine.number().min(-90).max(90).optional(),
    longitude: vine.number().min(-180).max(180).optional(),
    notes: vine.string().trim().optional(),
  })
)
