import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class AppSecret extends BaseModel {
  static table = 'app_secrets'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare key: string

  @column()
  declare value: string

  @column()
  declare description: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
