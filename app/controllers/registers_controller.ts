import User from '#models/user'
import { getUpdatableFields } from '#services/datatoupdate'
import { generateAccessToken } from '#services/generateaccesstoken'
import { generateOtp } from '#services/generateotp'
import { createUser } from '#services/setuserotp'
import smsservice from '#services/smsservice'
import { validateAndActivateUserOtp } from '#services/validateuserotp'
import abilities from '#start/abilities'
import {
  registerUserValidator,
  setPasswordValidator,
  UpdateUserValidator,
  UpdateUserValidatorForAdmin,
} from '#validators/user'
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
      // try {
      //   await Mailservice.sendMail(user.email, otpCode)
      // } catch (mailError) {
      //   // Delete user if email sending fails
      //   await user.delete()
      //   logger.error("Erreur lors de l'envoi de l'email :", {
      //     message: mailError.message,
      //     stack: mailError.stack,
      //     code: mailError.code,
      //   })
      // }

      // try {
      //   console.log('Envoi de l’OTP par WhatsApp', user.phone, otpCode)

      //   await WhatsappService.sendOtp(user.phone, otpCode)
      // } catch (error) {
      //   console.error('Erreur lors de l’envoi WhatsApp:', error.response?.data || error.message)
      //   throw error
      // }
      // Send response
      return response.send({
        message: 'saisir le opt pour continuer',
        status: 201,
        id: user.id,
        otp: otpCode,
        expiresAt: otpExpiredAt,
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
        error: err.message,
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

      const accessToken = await generateAccessToken(result.user as User, {
        abilities: abilities['vendeur'],
      })

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

  async login({ request, auth, response }: HttpContext) {
    const { uid, password } = request.only(['uid', 'password'])
    try {
      const user = await User.verifyCredentials(uid, password)
      const token = await auth.use('api').createToken(user)
      return response.ok({
        message: 'Connexion réussie avec succès',
        token,
        user: user.serialize(),
        status: 200,
      })
    } catch (error) {
      if (error.code === 'E_INVALID_AUTH_UID') {
        return response.unauthorized({
          message: 'Identifiants invalides',
          status: 401,
          error: error.message,
        })
      } else if (error.code === 'E_INVALID_AUTH_PASSWORD') {
        return response.unauthorized({
          message: 'Mot de passe incorrect',
          status: 401,
          error: error.message,
        })
      } else {
        return response.internalServerError({
          message: 'Erreur interne lors de la connexion',
          status: 500,
          error: error.message,
        })
      }
    }
  }

  async logout({ auth, response }: HttpContext) {
    try {
      await auth.use('api').invalidateToken()
    } catch (error) {
      return response.internalServerError({
        message: 'Erreur interne lors de la déconnexion',
        status: 500,
      })
    }
  }

  async sendDataForUpdate({ response, auth, params }: HttpContext) {
    try {
      const targetUser = await User.findOrFail(params.userId)
      const user = auth.user!
      console.log('getUpdatableFields', user.id, targetUser.id)
      const dataForUpdate = getUpdatableFields(user, targetUser)
      if ('error' in dataForUpdate) {
        return response.unauthorized({
          message: dataForUpdate.error.message,
          status: 401,
        })
      }
      return response.ok({
        message: 'Données récupérées avec succès',
        status: 200,
        data: dataForUpdate,
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          message: 'Utilisateur introuvable',
          status: 404,
        })
      }
      return response.internalServerError({
        message: 'Erreur interne lors de la récupération des données de l’utilisateur',
        status: 500,
      })
    }
  }

  async updateUser({ request, response, auth, params }: HttpContext) {
    const currentUser = auth.user!

    try {
      const targetUser = await User.findOrFail(params.userId)

      const isAdmin = ['admin', 'superadmin'].includes(currentUser.role)

      let validatedPayload

      if (isAdmin) {
        validatedPayload = await request.validateUsing(UpdateUserValidatorForAdmin)
      } else {
        const requestData = request.only(['firstName', 'lastName', 'phone'])
        validatedPayload = await UpdateUserValidator.validate({
          ...targetUser.serialize(), //conserve default values of user
          ...requestData,
        })
      }
      targetUser.merge(validatedPayload)
      await targetUser.save()
      return response.ok({
        message: 'Utilisateur mis à jour avec succès',
        status: 200,
        data: targetUser,
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          message: 'Utilisateur introuvable',
          status: 404,
        })
      }
      if (error.code === 'E_VALIDATION_ERROR') {
        return response.badRequest({
          message: 'Données invalides',
          errors: error.messages,
          status: 400,
        })
      }
      if (error.code === 'E_AUTHORIZATION_FAILURE') {
        return response.forbidden({
          message: "Vous n'êtes pas autorisé à mettre à jour cet utilisateur",
          status: 403,
        })
      }
      return response.internalServerError({
        message: 'Erreur interne lors de la mise à jour de l’utilisateur',
        status: 500,
      })
    }
  }

  async deleteUser({ response, auth, params }: HttpContext) {
    const currentUser = auth.user!

    try {
      const targetUser = await User.findOrFail(params.userId)

      if (currentUser.id === targetUser.id) {
        return response.forbidden({
          message: 'Vous ne pouvez pas supprimer votre propre compte',
          status: 403,
        })
      }

      await targetUser.delete()
      return response.ok({
        message: 'Utilisateur supprimé avec succès',
        status: 200,
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          message: 'Utilisateur introuvable',
          status: 404,
        })
      }
      return response.internalServerError({
        message: 'Erreur interne lors de la suppression de l’utilisateur',
        status: 500,
      })
    }
  }
  async getUser({ response, auth }: HttpContext) {
    try {
      const user = auth.user!
      return response.ok({
        message: 'Utilisateur récupéré avec succès',
        status: 200,
        data: user,
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Erreur interne lors de la récupération de l’utilisateur',
        status: 500,
      })
    }
  }
  async getAllUsers({ response, auth }: HttpContext) {
    try {
      // Check if the user is an admin or superadmin
      const user = auth.user!
      if (!['admin', 'superadmin'].includes(user.role)) {
        return response.forbidden({
          message: 'Vous n’êtes pas autorisé à accéder à cette ressource',
          status: 403,
        })
      }

      // Fetch all users

      const users = await User.all()
      return response.ok({
        message: 'Utilisateurs récupérés avec succès',
        status: 200,
        data: users,
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Erreur interne lors de la récupération des utilisateurs',
        status: 500,
      })
    }
  }
  async getUserById({ response, auth, params }: HttpContext) {
    try {
      const user = auth.user!
      if (user.id !== params.userId && !['admin', 'superadmin'].includes(user.role)) {
        return response.forbidden({
          message: 'Vous n’êtes pas autorisé à accéder à cet utilisateur',
          status: 403,
        })
      }
      const targetUser = await User.findOrFail(params.userId)
      return response.ok({
        message: 'Utilisateur récupéré avec succès',
        status: 200,
        data: targetUser,
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          message: 'Utilisateur introuvable',
          status: 404,
        })
      }
      return response.internalServerError({
        message: 'Erreur interne lors de la récupération de l’utilisateur',
        status: 500,
      })
    }
  }

  async forgotPassWord({ request, response }: HttpContext) {
    const { phone } = request.only(['phone'])
    try {
      const user = await User.findByOrFail('phone', phone)
      //Generate token
      const { otpCode, otpExpiredAt } = generateOtp()
      // Set user OTP code and expiration time
      await createUser.setUserOtp(user, otpCode, otpExpiredAt)

      await smsservice.envoyerSms(user.phone, user.secureOtp as number)
      return response.ok({
        message: 'Un code de réinitialisation a été envoyé à votre téléphone',
        status: 200,
        otp: user.secureOtp,
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          message: 'Utilisateur introuvable',
          status: 404,
        })
      }
      logger.error('Erreur lors de la demande de réinitialisation du mot de passe', {
        message: error.message,
        stack: error.stack,
      })
      return response.internalServerError({
        message: 'Erreur interne lors de la demande de réinitialisation du mot de passe',
        status: 500,
      })
    }
  }

  async resetPassword({ request, response }: HttpContext) {
    const { otp } = request.only(['otp'])
    try {
      const payload = await request.validateUsing(setPasswordValidator)
      const user = await User.findByOrFail('secureOtp', otp)
      if (user.otpExpiredAt && user.otpExpiredAt < new Date()) {
        return response.badRequest({
          message: 'Code OTP invalide, expiré ou utilisateur non trouvé',
          status: 400,
        })
      }
      user.password = payload.newPassword
      user.secureOtp = null
      user.otpExpiredAt = null
      await user.save()
      const accessToken = await generateAccessToken(user, {
        abilities: abilities[user.role],
      })
      return response.ok({
        message: 'Mot de passe réinitialisé avec succès',
        status: 200,
        accessToken: accessToken?.value!.release(),
        expiresIn: accessToken?.expiresAt,
        userId: accessToken?.tokenableId,
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          message: 'Utilisateur introuvable',
          status: 404,
        })
      }
      logger.error('Erreur lors de la réinitialisation du mot de passe', {
        message: error.message,
        stack: error.stack,
      })
      return response.internalServerError({
        message: 'Erreur interne lors de la réinitialisation du mot de passe',
        status: 500,
      })
    }
  }
}
