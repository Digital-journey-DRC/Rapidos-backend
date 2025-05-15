import { WhatsappService } from '#exceptions/whatssapotpservice';
import User from '#models/user';
import { getUpdatableFields } from '#services/datatoupdate';
import { generateAccessToken } from '#services/generateaccesstoken';
import { generateOtp } from '#services/generateotp';
import { Mailservice } from '#services/mailservice';
import { createUser } from '#services/setuserotp';
import { validateAndActivateUserOtp } from '#services/validateuserotp';
import abilities from '#start/abilities';
import { registerUserValidator, UpdateUserValidator, UpdateUserValidatorForAdmin, } from '#validators/user';
import logger from '@adonisjs/core/services/logger';
export default class RegistersController {
    async register({ request, response }) {
        try {
            const payload = await request.validateUsing(registerUserValidator);
            const user = await User.create({
                email: payload.email,
                password: payload.password,
                firstName: payload.firstName,
                lastName: payload.lastName,
                phone: payload.phone,
                role: payload.role,
                termsAccepted: payload.termsAccepted,
            });
            const { otpCode, otpExpiredAt } = generateOtp();
            await createUser.setUserOtp(user, otpCode, otpExpiredAt);
            try {
                await Mailservice.sendMail(user.email, otpCode);
            }
            catch (mailError) {
                await user.delete();
                logger.error("Erreur lors de l'envoi de l'email :", {
                    message: mailError.message,
                    stack: mailError.stack,
                    code: mailError.code,
                });
            }
            try {
                console.log('Envoi de l’OTP par WhatsApp', user.phone, otpCode);
                await WhatsappService.sendOtp(user.phone, otpCode);
            }
            catch (error) {
                console.error('Erreur lors de l’envoi WhatsApp:', error.response?.data || error.message);
                throw error;
            }
            return response.send({
                message: 'saisir le opt pour continuer',
                status: 201,
                id: user.id,
                otp: otpCode,
                expiresAt: otpExpiredAt,
            });
        }
        catch (err) {
            if (err.code === 'E_VALIDATION_ERROR') {
                logger.warn('Erreur de validation lors de l’inscription', err.messages);
                return response.badRequest({
                    message: 'Données invalides',
                    errors: err.messages,
                    status: 400,
                });
            }
            logger.error('Erreur interne lors de la création de l’utilisateur', {
                message: err.message,
                stack: err.stack,
            });
            return response.internalServerError({
                message: 'Une erreur interne est survenue. Veuillez réessayer plus tard.',
                status: 500,
            });
        }
    }
    async verifyOtp({ request, response, params }) {
        const otp = request.input('otp');
        const userId = params.userId;
        try {
            const result = await validateAndActivateUserOtp(userId, otp);
            if (result.error) {
                return response.status(result.error.status).send({
                    message: result.error.message,
                    status: result.error.status,
                });
            }
            const accessToken = await generateAccessToken(result.user, {
                abilities: abilities['vendeur'],
            });
            return response.send({
                type: 'bearer',
                value: accessToken?.value.release(),
                expiresIn: accessToken?.expiresAt,
                userId: accessToken?.tokenableId,
            });
        }
        catch (err) {
            if (err.code === 'E_ROW_NOT_FOUND') {
                return response.notFound({
                    message: 'Utilisateur introuvable',
                    status: 404,
                });
            }
            logger.error('Erreur lors de la vérification de l’OTP :', err);
            return response.internalServerError({
                message: 'Une erreur interne est survenue lors de la vérification de l’OTP',
                status: 500,
            });
        }
    }
    async login({ request, auth, response }) {
        const { email, password } = request.only(['email', 'password']);
        try {
            const user = await User.verifyCredentials(email, password);
            return await auth.use('api').createToken(user);
        }
        catch (error) {
            if (error.code === 'E_INVALID_AUTH_UID') {
                return response.unauthorized({
                    message: 'Identifiants invalides',
                    status: 401,
                });
            }
            else if (error.code === 'E_INVALID_AUTH_PASSWORD') {
                return response.unauthorized({
                    message: 'Mot de passe incorrect',
                    status: 401,
                });
            }
            else {
                return response.internalServerError({
                    message: 'Erreur interne lors de la connexion',
                    status: 500,
                });
            }
        }
    }
    async logout({ auth, response }) {
        try {
            await auth.use('api').invalidateToken();
        }
        catch (error) {
            return response.internalServerError({
                message: 'Erreur interne lors de la déconnexion',
                status: 500,
            });
        }
    }
    async sendDataForUpdate({ response, auth, params }) {
        try {
            const targetUser = await User.findOrFail(params.userId);
            const user = auth.user;
            console.log('getUpdatableFields', user.id, targetUser.id);
            const dataForUpdate = getUpdatableFields(user, targetUser);
            if ('error' in dataForUpdate) {
                return response.unauthorized({
                    message: dataForUpdate.error.message,
                    status: 401,
                });
            }
            return response.ok({
                message: 'Données récupérées avec succès',
                status: 200,
                data: dataForUpdate,
            });
        }
        catch (error) {
            if (error.code === 'E_ROW_NOT_FOUND') {
                return response.notFound({
                    message: 'Utilisateur introuvable',
                    status: 404,
                });
            }
            return response.internalServerError({
                message: 'Erreur interne lors de la récupération des données de l’utilisateur',
                status: 500,
            });
        }
    }
    async updateUser({ request, response, auth, params }) {
        const currentUser = auth.user;
        try {
            const targetUser = await User.findOrFail(params.userId);
            const isAdmin = ['admin', 'superadmin'].includes(currentUser.role);
            let validatedPayload;
            if (isAdmin) {
                validatedPayload = await request.validateUsing(UpdateUserValidatorForAdmin);
            }
            else {
                const requestData = request.only(['firstName', 'lastName', 'phone']);
                validatedPayload = await UpdateUserValidator.validate({
                    ...targetUser.serialize(),
                    ...requestData,
                });
            }
            targetUser.merge(validatedPayload);
            await targetUser.save();
            return response.ok({
                message: 'Utilisateur mis à jour avec succès',
                status: 200,
                data: targetUser,
            });
        }
        catch (error) {
            if (error.code === 'E_ROW_NOT_FOUND') {
                return response.notFound({
                    message: 'Utilisateur introuvable',
                    status: 404,
                });
            }
            if (error.code === 'E_VALIDATION_ERROR') {
                return response.badRequest({
                    message: 'Données invalides',
                    errors: error.messages,
                    status: 400,
                });
            }
            if (error.code === 'E_AUTHORIZATION_FAILURE') {
                return response.forbidden({
                    message: "Vous n'êtes pas autorisé à mettre à jour cet utilisateur",
                    status: 403,
                });
            }
            return response.internalServerError({
                message: 'Erreur interne lors de la mise à jour de l’utilisateur',
                status: 500,
            });
        }
    }
}
//# sourceMappingURL=registers_controller.js.map