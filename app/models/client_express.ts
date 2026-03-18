import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class ClientExpress extends BaseModel {
  static table = 'client_express'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare phone: string

  @column()
  declare email: string | null

  @column()
  declare defaultAddress: string | null

  @column()
  declare pays: string | null

  @column()
  declare province: string | null

  @column()
  declare ville: string | null

  @column()
  declare commune: string | null

  @column()
  declare avenue: string | null

  @column()
  declare defaultReference: string | null

  @column()
  declare latitude: number | null

  @column()
  declare longitude: number | null

  @column()
  declare vendorId: number

  @column()
  declare notes: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
