import vine from '@vinejs/vine'
import { Modepaiement } from '../Enum/mode_paiement.js'

export const createPaymentMethodValidator = vine.compile(
  vine.object({
    type: vine.enum(Object.values(Modepaiement)),
    numeroCompte: vine.string().trim().minLength(8).maxLength(50),
    nomTitulaire: vine.string().trim().maxLength(100).optional(),
    isDefault: vine.boolean().optional(),
  })
)

export const activateTemplateValidator = vine.compile(
  vine.object({
    templateId: vine.number(),
    numeroCompte: vine.string().trim().minLength(8).maxLength(50),
    nomTitulaire: vine.string().trim().maxLength(100).optional(),
    isDefault: vine.boolean().optional(),
  })
)

export const updatePaymentMethodValidator = vine.compile(
  vine.object({
    type: vine.enum(Object.values(Modepaiement)).optional(),
    numeroCompte: vine.string().trim().minLength(8).maxLength(50).optional(),
    nomTitulaire: vine.string().trim().maxLength(100).optional(),
    isDefault: vine.boolean().optional(),
    isActive: vine.boolean().optional(),
  })
)

