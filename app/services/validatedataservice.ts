import User from '#models/user'
import { registerUserValidator } from '#validators/user'

export async function validateDataService(data: any): Promise<any> {
  try {
    const payload = await registerUserValidator.validate(data)
    const existingUser = await User.query().where('email', payload.email).first()
    if (existingUser) {
      return {
        error: {
          message: 'utilisateur existe déjà',
          status: 409,
        },
      }
    }

    return payload
  } catch (err) {
    if (err instanceof err.E_VALIDATION_ERROR) {
      return {
        error: {
          message: 'erreur de validation',
          status: 400,
          errors: err.messages,
        },
      }
    }
    return {
      error: {
        message: 'erreur interne du serveur',
        status: 500,
      },
    }
  }
}
