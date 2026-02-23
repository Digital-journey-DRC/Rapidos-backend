import vine from '@vinejs/vine'

/**
 * Validator pour créer un client express
 */
export const createClientExpressValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(255),
    phone: vine.string().trim().minLength(8).maxLength(50),
    email: vine.string().trim().email().optional(),
    defaultAddress: vine.string().trim().optional(),
    defaultReference: vine.string().trim().maxLength(255).optional(),
    vendorId: vine.number().positive(),
    notes: vine.string().trim().optional(),
  })
)

/**
 * Validator pour mettre à jour un client express
 */
export const updateClientExpressValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(255).optional(),
    phone: vine.string().trim().minLength(8).maxLength(50).optional(),
    email: vine.string().trim().email().optional(),
    defaultAddress: vine.string().trim().optional(),
    defaultReference: vine.string().trim().maxLength(255).optional(),
    notes: vine.string().trim().optional(),
  })
)
