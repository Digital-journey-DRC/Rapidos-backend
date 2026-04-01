import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class DeliveryFeeSettings extends BaseModel {
  static table = 'delivery_fee_settings'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare activeType: 'flat' | 'distance' | 'commune'

  @column()
  declare flatFee: number | null

  @column()
  declare distanceBaseFee: number | null

  @column()
  declare distancePerKmFee: number | null

  @column()
  declare communeDefaultFee: number

  @column()
  declare updatedBy: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
