import User from '#models/user'
import { ValidationOtpResult } from '../types/usertype.js'

export async function validateAndActivateUserOtp(
  userId: any,
  otp: number
): Promise<ValidationOtpResult> {
  try {
    if (!otp) {
      return {
        error: {
          message: 'otp requis',
          status: 400,
        },
      }
    }
    const user = await User.findByOrFail(userId)
    if (!user) {
      return {
        error: {
          message: 'Utilisateur introuvable',
          status: 404,
        },
      }
    }
    if (user.secureOtp !== otp) {
      return {
        error: {
          message: 'otp invalide',
          status: 400,
        },
      }
    }

    const currentTime = Date.now()
    const otpExpiration = user.otpExpiredAt?.toMillis?.() ?? 0

    if (currentTime > otpExpiration) {
      return {
        error: {
          message: 'otp expiré',
          status: 400,
        },
      }
    }

    user.secureOtp = null
    user.otpExpiredAt = null
    await user.save()

    return { user }
  } catch (error) {
    return {
      error: {
        message: "erreur lors de la validation de l'otp",
        status: 500,
      },
    }
  }
}
