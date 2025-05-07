import User from '#models/user'
import { generateAccessToken } from '#services/generateaccesstoken'
import { generateOtp } from '#services/generateotp'
import { Mailservice } from '#services/mailservice'
import { createUser } from '#services/setuserotp'
import { validateDataService } from '#services/validatedataservice'
import { validateAndActivateUserOtp } from '#services/validateuserotp'
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'

export default class RegistersController {
  async register({ request, response }: HttpContext) {
    const data = request.all()
    try {
      // Create user
      const payload = await validateDataService(data)
      const user = await User.create(payload)
      // Generate OTP code
      // Set OTP code and expiration time
      const { otpCode } = generateOtp()

      // Set user OTP code and expiration time
      await createUser.setUserOtp(user)

      // // Configure nodemailer and send mail to user's email
      try {
        await Mailservice.sendMail(user.email, otpCode)
      } catch (mailError) {
        // Delete user if email sending fails
        await user.delete()
        logger.error("Erreur lors de l'envoi de l'email :", mailError)
        return response.internalServerError({
          message: "erreur lors de l'envoi de l'email",
          status: 500,
        })
      }
      // Send response
      return response.send({
        message: 'saisir le opt pour continuer',
        status: 201,
        id: user.id,
      })
    } catch (err) {
      if (err instanceof err.E_VALIDATION_ERROR) {
        return response.badRequest({
          message: 'erreur de validation',
          status: 400,
          errors: err.messages,
        })
      }
      logger.error('Erreur lors de la création :', err)

      response.internalServerError('erreur interne du serveur')
    }
  }

  async verifyOtp({ request, response, params, auth }: HttpContext) {
    const otp = request.input('otp')
    const userId = params.userId

    try {
      const { user } = await validateAndActivateUserOtp(userId, otp)

      const accessToken = await generateAccessToken(user as User)

      // athenticate user
      await auth.authenticate()
      // Send response
      return response.send({
        type: 'bearer',
        value: accessToken?.value!.release(),
      })
    } catch (err) {
      if (err.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          message: 'Utilisateur introuvable',
          status: 404,
        })
      }

      // Autres erreurs inattendues
      logger.error('Erreur lors de la vérification de l’OTP :', err)

      return response.internalServerError({
        message: 'Une erreur interne est survenue lors de la vérification de l’OTP',
        status: 500,
      })
    }
  }
}
