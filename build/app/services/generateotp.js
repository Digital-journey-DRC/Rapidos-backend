export const generateOtp = () => {
    const otpCode = Math.floor(100000 + Math.random() * 900000);
    const otpExpiredAt = new Date(Date.now() + 50 * 60 * 1000);
    return { otpCode, otpExpiredAt };
};
//# sourceMappingURL=generateotp.js.map