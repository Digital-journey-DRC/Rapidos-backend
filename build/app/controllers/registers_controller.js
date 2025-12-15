import User from '#models/user';
import { getUpdatableFields } from '#services/datatoupdate';
import { generateAccessToken } from '#services/generateaccesstoken';
import { generateOtp } from '#services/generateotp';
import { createUser } from '#services/setuserotp';
import smsservice from '#services/smsservice';
import { validateAndActivateUserOtp } from '#services/validateuserotp';
import abilities from '#start/abilities';
import { registerUserValidator, setPasswordValidator, UpdateUserValidator, UpdateUserValidatorForAdmin, } from '#validators/user';
import logger from '@adonisjs/core/services/logger';
import { UserRole } from '../Enum/user_role.js';
import { UserStatus } from '../Enum/user_status.js';
import { uploadProfilePicture } from '#services/upload_profil';
import Media from '#models/media';
import { WhatsappService } from '#exceptions/whatssapotpservice';
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
                userStatus: UserRole.Livreur ? UserStatus.PENDING : UserStatus.ACTIVE,
                termsAccepted: payload.termsAccepted,
            });
            const { otpCode, otpExpiredAt } = generateOtp();
            await createUser.setUserOtp(user, otpCode, otpExpiredAt);
            await smsservice.envoyerSms(user.phone, user.secureOtp);
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
                error: err.message,
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
        const { uid, password } = request.only(['uid', 'password']);
        try {
            const user = await User.verifyCredentials(uid, password);
            const token = await auth.use('api').createToken(user);
            return response.ok({
                message: 'Connexion réussie avec succès',
                token,
                user: user.serialize(),
                status: 200,
            });
        }
        catch (error) {
            if (error.code === 'E_INVALID_AUTH_UID') {
                return response.unauthorized({
                    message: 'Identifiants invalides',
                    status: 401,
                    error: error.message,
                });
            }
            else if (error.code === 'E_INVALID_AUTH_PASSWORD') {
                return response.unauthorized({
                    message: 'Mot de passe incorrect',
                    status: 401,
                    error: error.message,
                });
            }
            else {
                return response.internalServerError({
                    message: 'Erreur interne lors de la connexion',
                    status: 500,
                    error: error.message,
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
    async deleteUser({ response, auth, params }) {
        const currentUser = auth.user;
        try {
            const targetUser = await User.findOrFail(params.userId);
            if (currentUser.id === targetUser.id) {
                return response.forbidden({
                    message: 'Vous ne pouvez pas supprimer votre propre compte',
                    status: 403,
                });
            }
            await targetUser.delete();
            return response.ok({
                message: 'Utilisateur supprimé avec succès',
                status: 200,
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
                message: 'Erreur interne lors de la suppression de l’utilisateur',
                status: 500,
            });
        }
    }
    async getUser({ response, auth }) {
        try {
            const currentUser = auth.user;
            const userWithProfile = await User.query()
                .where('id', currentUser.id)
                .preload('profil', (query) => {
                query.preload('media');
            })
                .firstOrFail();
            let mediaUrl = null;
            if (userWithProfile.profil && userWithProfile.profil.media) {
                mediaUrl = userWithProfile.profil.media.mediaUrl;
            }
            const user = {
                user: currentUser,
                media: mediaUrl,
            };
            return response.ok({
                message: 'Utilisateur récupéré avec succès',
                status: 200,
                data: user,
            });
        }
        catch (error) {
            return response.internalServerError({
                message: 'Erreur interne lors de la récupération de l’utilisateur',
                status: 500,
            });
        }
    }
    async getAllUsers({ response, auth }) {
        try {
            const user = auth.user;
            if (!['admin', 'superadmin'].includes(user.role)) {
                return response.forbidden({
                    message: 'Vous n’êtes pas autorisé à accéder à cette ressource',
                    status: 403,
                });
            }
            const users = await User.all();
            return response.ok({
                message: 'Utilisateurs récupérés avec succès',
                status: 200,
                data: users,
            });
        }
        catch (error) {
            return response.internalServerError({
                message: 'Erreur interne lors de la récupération des utilisateurs',
                status: 500,
            });
        }
    }
    async getUserById({ response, auth, params }) {
        try {
            const user = auth.user;
            if (user.id !== params.userId && !['admin', 'superadmin'].includes(user.role)) {
                return response.forbidden({
                    message: 'Vous n’êtes pas autorisé à accéder à cet utilisateur',
                    status: 403,
                });
            }
            const targetUser = await User.findOrFail(params.userId);
            return response.ok({
                message: 'Utilisateur récupéré avec succès',
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
            return response.internalServerError({
                message: 'Erreur interne lors de la récupération de l’utilisateur',
                status: 500,
            });
        }
    }
    async forgotPassWord({ request, response }) {
        const { phone } = request.only(['phone']);
        try {
            const user = await User.findByOrFail('phone', phone);
            const { otpCode, otpExpiredAt } = generateOtp();
            await createUser.setUserOtp(user, otpCode, otpExpiredAt);
            await smsservice.envoyerSms(user.phone, user.secureOtp);
            return response.ok({
                message: 'Un code de réinitialisation a été envoyé à votre téléphone',
                status: 200,
            });
        }
        catch (error) {
            if (error.code === 'E_ROW_NOT_FOUND') {
                return response.notFound({
                    message: 'Utilisateur introuvable',
                    status: 404,
                });
            }
            logger.error('Erreur lors de la demande de réinitialisation du mot de passe', {
                message: error.message,
                stack: error.stack,
            });
            return response.internalServerError({
                message: 'Erreur interne lors de la demande de réinitialisation du mot de passe',
                status: 500,
            });
        }
    }
    async resetPassword({ request, response }) {
        const { otp } = request.only(['otp']);
        try {
            const payload = await request.validateUsing(setPasswordValidator);
            const user = await User.findByOrFail('secureOtp', otp);
            if (user.otpExpiredAt && user.otpExpiredAt < new Date()) {
                return response.badRequest({
                    message: 'Code OTP invalide, expiré ou utilisateur non trouvé',
                    status: 400,
                });
            }
            user.password = payload.newPassword;
            user.secureOtp = null;
            user.otpExpiredAt = null;
            await user.save();
            const accessToken = await generateAccessToken(user, {
                abilities: abilities[user.role],
            });
            return response.ok({
                message: 'Mot de passe réinitialisé avec succès',
                status: 200,
                accessToken: accessToken?.value.release(),
                expiresIn: accessToken?.expiresAt,
                userId: accessToken?.tokenableId,
            });
        }
        catch (error) {
            if (error.code === 'E_ROW_NOT_FOUND') {
                return response.notFound({
                    message: 'Utilisateur introuvable',
                    status: 404,
                });
            }
            logger.error('Erreur lors de la réinitialisation du mot de passe', {
                message: error.message,
                stack: error.stack,
            });
            return response.internalServerError({
                message: 'Erreur interne lors de la réinitialisation du mot de passe',
                status: 500,
            });
        }
    }
    async activeUserAcount({ params, response, bouncer }) {
        const { id } = params;
        try {
            if (await bouncer.denies('canActiveUserAccount')) {
                return response.forbidden({
                    message: "Vous n'êtes pas autorisé à activer ce compte",
                    status: 403,
                });
            }
            const user = await User.findOrFail(id);
            if (user.userStatus === UserStatus.ACTIVE) {
                return response.ok({
                    message: 'Compte déjà actif',
                    status: 200,
                });
            }
            user.userStatus = UserStatus.ACTIVE;
            await user.save();
            return response.ok({
                message: 'Compte activé avec succès',
                status: 200,
                user: user.serialize(),
            });
        }
        catch (error) {
            if (error.code === 'E_ROW_NOT_FOUND') {
                return response.notFound({
                    message: 'Utilisateur introuvable',
                    status: 404,
                });
            }
            if (error.code === 'E_AUTHORIZATION_FAILURE') {
                return response.forbidden({
                    message: "Vous n'êtes pas autorisé à activer ce compte",
                    status: 403,
                });
            }
            logger.error('Erreur lors de l’activation du compte utilisateur', {
                message: error.message,
                stack: error.stack,
            });
            return response.internalServerError({
                message: 'Erreur interne lors de l’activation du compte utilisateur',
                status: 500,
            });
        }
    }
    async showAllUserWithStatusPendning({ response, bouncer }) {
        try {
            if (await bouncer.denies('canAcceptDelivery')) {
                return response.forbidden({
                    message: "Vous n'avez pas accès à cette fonctionnalité",
                    status: 403,
                });
            }
            const users = await User.query().where('userStatus', UserStatus.PENDING);
            return response.ok({
                message: 'Utilisateurs avec statut en attente',
                status: 200,
                users: users.map((u) => u.serialize()),
            });
        }
        catch (error) {
            logger.error('Erreur lors de la récupération des utilisateurs en attente', {
                message: error.message,
                stack: error.stack,
            });
            return response.internalServerError({
                message: 'Erreur interne lors de la récupération des utilisateurs en attente',
                status: 500,
            });
        }
    }
    async updateUserProfile({ request, response, auth }) {
        const curentUser = auth.user;
        const avatar = request.file('avatar', {
            size: '2mb',
            extnames: ['jpg', 'jpeg', 'png'],
        });
        if (!avatar || !avatar.isValid || !avatar.tmpPath) {
            return response.badRequest({
                message: 'Fichier invalide ou manquant',
                status: 400,
            });
        }
        try {
            const uploadedResult = await uploadProfilePicture(avatar.tmpPath);
            const media = await Media.create({
                mediaUrl: uploadedResult.secure_url,
                mediaType: uploadedResult.format,
            });
            await curentUser.related('profil').updateOrCreate({
                userId: curentUser.id,
            }, {
                mediaId: media.id,
            });
            return response.ok({
                message: 'Profil mis à jour avec succès',
                status: 200,
                avatarUrl: media.mediaUrl,
            });
        }
        catch (error) {
            if (error.code === 'E_VALIDATION_ERROR') {
                return response.badRequest({
                    message: 'Données invalides',
                    errors: error.messages,
                    status: 400,
                });
            }
            logger.error('Erreur lors de la mise à jour du profil utilisateur', {
                message: error.message,
                stack: error.stack,
            });
            return response.internalServerError({
                message: 'Erreur interne lors de la mise à jour du profil utilisateur',
                status: 500,
            });
        }
    }
    async updatePhone({ request, response, auth }) {
        try {
            const { newPhone } = request.only(['newPhone']);
            if (!newPhone) {
                return response.badRequest({
                    message: 'Le nouveau numéro de téléphone est requis',
                    status: 400,
                });
            }
            const user = auth.user;
            if (!user) {
                return response.unauthorized({
                    message: 'Vous devez être connecté pour modifier votre numéro de téléphone',
                    status: 401,
                });
            }
            const currentUser = await User.findOrFail(user.id);
            if (currentUser.phone === newPhone) {
                return response.badRequest({
                    message: 'Le nouveau numéro de téléphone doit être différent de l\'ancien',
                    status: 400,
                });
            }
            const existingUser = await User.findBy('phone', newPhone);
            if (existingUser && existingUser.id !== currentUser.id) {
                return response.conflict({
                    message: 'Ce numéro de téléphone est déjà utilisé par un autre utilisateur',
                    status: 409,
                });
            }
            const { otpCode, otpExpiredAt } = generateOtp();
            await createUser.setUserOtp(currentUser, otpCode, otpExpiredAt);
            try {
                await smsservice.envoyerSms(newPhone, otpCode);
            }
            catch (smsError) {
                logger.error('Erreur lors de l\'envoi du SMS', {
                    error: smsError.message,
                    phone: newPhone,
                });
                try {
                    await WhatsappService.sendOtp(newPhone, otpCode);
                }
                catch (whatsappError) {
                    logger.error('Erreur lors de l\'envoi du WhatsApp', {
                        error: whatsappError.message,
                        phone: newPhone,
                    });
                }
            }
            return response.ok({
                message: 'Un code de vérification a été envoyé à votre nouveau numéro de téléphone',
                status: 200,
                newPhone: newPhone,
                expiresAt: otpExpiredAt,
            });
        }
        catch (error) {
            if (error.code === 'E_ROW_NOT_FOUND') {
                return response.notFound({
                    message: 'Utilisateur introuvable',
                    status: 404,
                });
            }
            logger.error('Erreur lors de la demande de changement de numéro de téléphone', {
                message: error.message,
                stack: error.stack,
            });
            return response.internalServerError({
                message: 'Erreur interne lors de la demande de changement de numéro de téléphone',
                status: 500,
                error: error.message,
            });
        }
    }
    async verifyPhoneOtp({ request, response, auth }) {
        try {
            const { otp, newPhone } = request.only(['otp', 'newPhone']);
            if (!otp || !newPhone) {
                return response.badRequest({
                    message: 'L\'OTP et le nouveau numéro de téléphone sont requis',
                    status: 400,
                });
            }
            const user = auth.user;
            if (!user) {
                return response.unauthorized({
                    message: 'Vous devez être connecté pour vérifier l\'OTP',
                    status: 401,
                });
            }
            const currentUser = await User.findOrFail(user.id);
            if (!currentUser.secureOtp || currentUser.secureOtp !== Number(otp)) {
                currentUser.secureOtp = null;
                currentUser.otpExpiredAt = null;
                await currentUser.save();
                return response.badRequest({
                    message: 'Code OTP invalide',
                    status: 400,
                });
            }
            if (!currentUser.otpExpiredAt || new Date() > new Date(currentUser.otpExpiredAt)) {
                currentUser.secureOtp = null;
                currentUser.otpExpiredAt = null;
                await currentUser.save();
                return response.badRequest({
                    message: 'Code OTP expiré. Veuillez demander un nouveau code',
                    status: 400,
                });
            }
            const existingUser = await User.findBy('phone', newPhone);
            if (existingUser && existingUser.id !== currentUser.id) {
                currentUser.secureOtp = null;
                currentUser.otpExpiredAt = null;
                await currentUser.save();
                return response.conflict({
                    message: 'Ce numéro de téléphone est déjà utilisé par un autre utilisateur',
                    status: 409,
                });
            }
            currentUser.phone = newPhone;
            currentUser.secureOtp = null;
            currentUser.otpExpiredAt = null;
            await currentUser.save();
            return response.ok({
                message: 'Numéro de téléphone mis à jour avec succès',
                status: 200,
                phone: currentUser.phone,
            });
        }
        catch (error) {
            if (error.code === 'E_ROW_NOT_FOUND') {
                return response.notFound({
                    message: 'Utilisateur introuvable',
                    status: 404,
                });
            }
            logger.error('Erreur lors de la vérification de l\'OTP pour le changement de numéro', {
                message: error.message,
                stack: error.stack,
            });
            return response.internalServerError({
                message: 'Erreur interne lors de la vérification de l\'OTP',
                status: 500,
                error: error.message,
            });
        }
    }
}
//# sourceMappingURL=registers_controller.js.map