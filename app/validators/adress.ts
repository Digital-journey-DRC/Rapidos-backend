import vine from '@vinejs/vine'
import { TypeAdresse } from '../Enum/type_adresse.js'

export const adresseValidator = vine.compile(
  vine.object({
    ville: vine.string().trim().minLength(2).maxLength(50),
    avenue: vine.string().trim().minLength(2).maxLength(100),
    codePostale: vine
      .string()
      .trim()
      .regex(/^\d{4,6}$/), // Ex: 12345
    numero: vine.string().trim().maxLength(10),
    isPrincipal: vine.boolean(),
    type: vine.enum(TypeAdresse),
    pays: vine.string().trim().minLength(2).maxLength(50),
    quartier: vine.string().trim().maxLength(50).optional(),
    commune: vine.string().trim().maxLength(50).optional(),
  })
)
