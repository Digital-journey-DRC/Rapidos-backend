import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class CommuneDeliveryFee extends BaseModel {
  static table = 'commune_delivery_fees'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare communeName: string

  @column()
  declare fee: number

  @column()
  declare isActive: boolean

  @column()
  declare createdBy: number | null

  @column()
  declare updatedBy: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
