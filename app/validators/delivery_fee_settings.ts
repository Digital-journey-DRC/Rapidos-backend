import vine from '@vinejs/vine'

/**
 * Validator pour la mise à jour de la configuration des frais de livraison
 */
export const updateDeliveryFeeSettingsValidator = vine.compile(
  vine.object({
    activeType: vine.enum(['flat', 'distance', 'commune']),
    flatFee: vine.number().positive().optional(),
    distanceBaseFee: vine.number().positive().optional(),
    distancePerKmFee: vine.number().positive().optional(),
    communeDefaultFee: vine.number().positive().optional(),
  })
)

/**
 * Validator pour la création d'une commune
 */
export const createCommuneValidator = vine.compile(
  vine.object({
    communeName: vine.string().trim().minLength(2).maxLength(100),
    fee: vine.number().positive(),
  })
)

/**
 * Validator pour la mise à jour d'une commune
 */
export const updateCommuneValidator = vine.compile(
  vine.object({
    fee: vine.number().positive().optional(),
    isActive: vine.boolean().optional(),
  })
)
