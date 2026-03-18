import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class CommandeExpressLog extends BaseModel {
  static table = 'commande_express_logs'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare logId: string

  @column()
  declare orderId: string

  @column()
  declare oldStatus: string | null

  @column()
  declare newStatus: string

  @column()
  declare changedBy: number

  @column()
  declare changedByRole: string

  @column()
  declare reason: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
