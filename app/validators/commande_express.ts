import vine from '@vinejs/vine'

/**
 * Validator pour créer une commande express
 */
export const createCommandeExpressValidator = vine.compile(
  vine.object({
    clientId: vine.number().positive(),
    clientName: vine.string().trim().minLength(2).maxLength(255),
    clientPhone: vine.string().trim().minLength(10).maxLength(50),
    vendorId: vine.number().positive(),
    packageValue: vine.number().positive().decimal([0, 2]),
    packageDescription: vine.string().trim().minLength(5),
    pickupAddress: vine.string().trim().minLength(10),
    deliveryAddress: vine.string().trim().minLength(10),
    pickupReference: vine.string().trim().optional(),
    deliveryReference: vine.string().trim().optional(),
    createdBy: vine.number().positive(),
    statut: vine.enum(['pending', 'en_cours', 'livre', 'annule']).optional(),
    items: vine.array(
      vine.object({
        productId: vine.number().positive().optional(),
        name: vine.string().trim().minLength(1),
        description: vine.string().trim().optional(),
        price: vine.number().positive().decimal([0, 2]).optional(),
        quantity: vine.number().positive().min(1),
        weight: vine.string().trim().optional(),
      })
    ).minLength(1),
  })
)

/**
 * Validator pour mettre à jour le statut d'une commande express
 */
export const updateCommandeExpressStatusValidator = vine.compile(
  vine.object({
    statut: vine.enum(['pending', 'en_cours', 'livre', 'annule']),
    reason: vine.string().trim().optional(),
  })
)

/**
 * Validator pour assigner un livreur
 */
export const assignDeliveryPersonValidator = vine.compile(
  vine.object({
    deliveryPersonId: vine.number().positive(),
  })
)
