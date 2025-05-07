import User from '#models/user'
import { generateOtp } from '#services/generateotp'
import { Mailservice } from '#services/mailservice'
import { createUser } from '#services/setuserotp'
import { registerUserValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'

export default class RegistersController {
  async register({ request, response }: HttpContext) {
    const data = request.all()
    try {
      const payload = await registerUserValidator.validate(data)
      const exisingUser = await User.query().where('email', payload.email).first()
      if (exisingUser) {
        return response.conflict({
          message: 'utilisateur existe déjà',
          status: 409,
        })
      }
      // Create user
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
}
