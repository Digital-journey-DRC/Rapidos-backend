import { DateTime } from 'luxon'
import { UserRole } from '../Enum/user_role.js'
import User from '#models/user'

export interface UserType {
  firstName: string
  lastName: string
  phone: string
  role: UserRole
  email: string
  password: string
  termsAccepted: boolean
  secureOtp: number
  otpExpiredAt: DateTime
  createdAt: Date
}

export interface ValidationOtpResult {
  error?: {
    message: string
    status: number
  }
  user?: User
}
