import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class EcommerceOrderLog extends BaseModel {
  static table = 'ecommerce_order_logs'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare logId: string

  @column()
  declare orderId: string

  @column()
  declare oldStatus: string

  @column()
  declare newStatus: string

  @column()
  declare changedBy: number

  @column()
  declare changedByRole: string

  @column()
  declare reason: string | null

  @column.dateTime({ autoCreate: true })
  declare timestamp: DateTime
}
