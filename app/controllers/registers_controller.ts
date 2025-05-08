import User from '#models/user'
import { generateAccessToken } from '#services/generateaccesstoken'
import { generateOtp } from '#services/generateotp'
import { Mailservice } from '#services/mailservice'
import { createUser } from '#services/setuserotp'
import { validateAndActivateUserOtp } from '#services/validateuserotp'
import { registerUserValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'

export default class RegistersController {
  async register({ request, response }: HttpContext) {
    try {
      // Validate data
      const payload = await request.validateUsing(registerUserValidator)

      const user = await User.create({
        email: payload.email,
        password: payload.password,
        firstName: payload.firstName,
        lastName: payload.lastName,
        phone: payload.phone,
        role: payload.role,
        termsAccepted: payload.termsAccepted,
      })

      // Generate OTP code
      // Set OTP code and expiration time
      const { otpCode, otpExpiredAt } = generateOtp()

      // Set user OTP code and expiration time
      await createUser.setUserOtp(user, otpCode, otpExpiredAt)

      // Configure nodemailer and send mail to user's email
      try {
        await Mailservice.sendMail(user.email, otpCode)
      } catch (mailError) {
        // Delete user if email sending fails
        await user.delete()
        logger.error("Erreur lors de l'envoi de l'email :", {
          message: mailError.message,
          stack: mailError.stack,
          code: mailError.code,
        })
      }
      // Send response
      return response.send({
        message: 'saisir le opt pour continuer',
        status: 201,
        id: user.id,
      })
    } catch (err) {
      if (err.code === 'E_VALIDATION_ERROR') {
        logger.warn('Erreur de validation lors de l’inscription', err.messages)
        return response.badRequest({
          message: 'Données invalides',
          errors: err.messages,
          status: 400,
        })
      }
      logger.error('Erreur interne lors de la création de l’utilisateur', {
        message: err.message,
        stack: err.stack,
      })

      return response.internalServerError({
        message: 'Une erreur interne est survenue. Veuillez réessayer plus tard.',
        status: 500,
      })
    }
  }

  async verifyOtp({ request, response, params }: HttpContext) {
    const otp = request.input('otp')
    const userId = params.userId

    try {
      const result = await validateAndActivateUserOtp(userId, otp)

      if (result.error) {
        return response.status(result.error.status).send({
          message: result.error.message,
          status: result.error.status,
        })
      }

      const accessToken = await generateAccessToken(result.user as User)

      // Send response
      return response.send({
        type: 'bearer',
        value: accessToken?.value!.release(),
        expiresIn: accessToken?.expiresAt,
        userId: accessToken?.tokenableId,
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
