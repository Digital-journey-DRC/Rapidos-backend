import { AppError } from '#exceptions/apperror';
import User from '#models/user';
import { v4 as uuidv4 } from 'uuid';
export async function validateAndActivateUserOtp(userId, otp) {
    try {
        if (!otp) {
            throw new AppError('Le code OTP est requis.', 400);
        }
        const user = await User.findByOrFail('id', userId);
        if (!user) {
            throw new AppError('Utilisateur introuvable.', 404);
        }
        if (user.secureOtp !== otp) {
            throw new AppError('Code OTP invalide.', 400);
        }
        const currentTime = Date.now();
        const otpExpiration = user.otpExpiredAt?.getTime();
        if (!otpExpiration || currentTime > otpExpiration) {
            throw new AppError('Le code OTP a expiré.', 400);
        }
        user.secureOtp = null;
        user.otpExpiredAt = null;
        await user.save();
        return { user };
    }
    catch (error) {
        if (error instanceof AppError) {
            return {
                error: {
                    message: error.message,
                    status: error.status,
                },
            };
        }
        const errorId = uuidv4();
        console.error({
            errorId,
            message: error.message,
            stack: error.stack,
            context: {
                userId,
                otp,
            },
        });
        return {
            error: {
                message: `Une erreur inattendue est survenue. Référence: ${errorId}`,
                status: 500,
            },
        };
    }
}
//# sourceMappingURL=validateuserotp.js.map