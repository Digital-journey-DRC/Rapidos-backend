import vine from '@vinejs/vine'
import { UserRole } from '../Enum/user_role.js'

export const registerUserValidator = vine.compile(
  vine.object({
    role: vine.enum(UserRole),
    email: vine
      .string()
      .trim()
      .toLowerCase()
      .email()
      .unique(async (db, value) => {
        const user = await db.from('users').where('email', value).first()
        return !user
      }),

    //, 'must contain at least one uppercase letter',
    // 'must contain at least one lowercase letter',
    // , 'must contain at least one digit'
    //, 'must contain at least one special character'

    password: vine
      .string()
      .minLength(12) // sécurité accrue
      .maxLength(64)
      .regex(/[A-Z]/)
      .regex(/[a-z]/)
      .regex(/[0-9]/)
      .regex(/[^A-Za-z0-9]/),

    firstName: vine.string().trim().escape().minLength(2).maxLength(50),
    lastName: vine.string().trim().escape().minLength(2).maxLength(50),

    //, 'invalid international phone number format'
    phone: vine
      .string()
      .regex(/^\+[1-9]\d{1,14}$/)
      .unique(async (db, value) => {
        const user = await db.from('users').where('phone', value).first()
        return !user
      }),

    //obligation de l'accéptation des termes et conditions d'utilisation
    termsAccepted: vine.boolean({ strict: true }),
  })
)

export const UpdateUserValidator = vine.compile(
  vine.object({
    firstName: vine.string().trim().escape().minLength(2).maxLength(50),
    lastName: vine.string().trim().escape().minLength(2).maxLength(50),

    //, 'invalid international phone number format'
    phone: vine.string().regex(/^\+[1-9]\d{1,14}$/),
  })
)

export const UpdateUserValidatorForAdmin = vine.compile(
  vine.object({
    email: vine.string().trim().toLowerCase().email().nullable(),
    role: vine.enum(UserRole),
    firstName: vine.string().trim().escape().minLength(2).maxLength(50),
    lastName: vine.string().trim().escape().minLength(2).maxLength(50),

    //, 'invalid international phone number format'
    phone: vine.string().regex(/^\+[1-9]\d{1,14}$/),
  })
)
// To handle custom messages, configure them in your validation middleware or handler as per VineJS documentation.

export const setPasswordValidator = vine.compile(
  vine.object({
    newPassword: vine
      .string()
      .minLength(8)
      .maxLength(64)
      .regex(/[A-Z]/)
      .regex(/[a-z]/)
      .regex(/[0-9]/)
      .regex(/[^A-Za-z0-9]/),
    confirmNewPassword: vine.string().minLength(12).maxLength(64).sameAs('newPassword'),
  })
)
