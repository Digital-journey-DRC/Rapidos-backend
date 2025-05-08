import User from '#models/user'

export const createUser = {
  async setUserOtp(user: User, otp: number, expireDate: Date) {
    // SET user otp code

    user.secureOtp = otp
    user.otpExpiredAt = expireDate
    await user.save()
    return user
  },
}
