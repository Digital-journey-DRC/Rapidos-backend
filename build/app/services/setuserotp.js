export const createUser = {
    async setUserOtp(user, otp, expireDate) {
        user.secureOtp = otp;
        user.otpExpiredAt = expireDate;
        await user.save();
        return user;
    },
};
//# sourceMappingURL=setuserotp.js.map