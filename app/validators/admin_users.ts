import vine from '@vinejs/vine'
import { UserRole } from '../Enum/user_role.js'
import { UserStatus } from '../Enum/user_status.js'

/**
 * Validator pour la création d'un utilisateur par l'admin
 */
export const adminCreateUserValidator = vine.compile(
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

    password: vine
      .string()
      .minLength(12)
      .maxLength(64)
      .regex(/[A-Z]/)
      .regex(/[a-z]/)
      .regex(/[0-9]/)
      .regex(/[^A-Za-z0-9]/),

    firstName: vine.string().trim().escape().minLength(2).maxLength(50),
    lastName: vine.string().trim().escape().minLength(2).maxLength(50),

    phone: vine
      .string()
      .regex(/^\+[1-9]\d{1,14}$/)
      .unique(async (db, value) => {
        const user = await db.from('users').where('phone', value).first()
        return !user
      }),

    userStatus: vine.enum(UserStatus).optional(),
  })
)

/**
 * Validator pour la mise à jour d'un utilisateur par l'admin
 */
export const adminUpdateUserValidator = vine.compile(
  vine.object({
    role: vine.enum(UserRole).optional(),
    email: vine.string().trim().toLowerCase().email().optional(),
    firstName: vine.string().trim().escape().minLength(2).maxLength(50).optional(),
    lastName: vine.string().trim().escape().minLength(2).maxLength(50).optional(),
    phone: vine.string().regex(/^\+[1-9]\d{1,14}$/).optional(),
    userStatus: vine.enum(UserStatus).optional(),
  })
)

/**
 * Validator pour changer le statut d'un utilisateur
 */
export const adminToggleStatusValidator = vine.compile(
  vine.object({
    userStatus: vine.enum(UserStatus),
  })
)
