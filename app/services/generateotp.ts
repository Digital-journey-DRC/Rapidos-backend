import { DateTime } from 'luxon'

export const generateOtp = () => {
  const otpCode = Math.floor(100000 + Math.random() * 900000)
  const otpExpiredAt = DateTime.now().plus({ minutes: 10 }) // 10 minutes expiration
  return { otpCode, otpExpiredAt }
}
