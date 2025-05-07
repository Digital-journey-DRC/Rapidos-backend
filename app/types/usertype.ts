import { DateTime } from 'luxon'
import { UserRole } from '../Enum/user_role.js'

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
