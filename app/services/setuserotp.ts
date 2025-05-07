import User from '#models/user'
import { generateOtp } from './generateotp.js'

export const createUser = {
  async setUserOtp(user: User) {
    // SET user otp code

    const { otpCode } = generateOtp()
    const { otpExpiredAt } = generateOtp()
    user.secureOtp = otpCode
    user.otpExpiredAt = otpExpiredAt
    await user.save()
    return user
  },
}
