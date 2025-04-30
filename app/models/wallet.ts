import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import { Devise } from '../Enum/devise.js'
import { StatusWallet } from '../Enum/status_wallet.js'
import { TypeoPeration } from '../Enum/type_operation.js'
import User from './user.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class Wallet extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number
  @column()
  declare balance: number
  @column()
  declare currency: Devise
  @column()
  declare status: StatusWallet
  @column()
  declare type: TypeoPeration

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Define any relationships here if needed

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
