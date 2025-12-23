import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import { Modepaiement } from '../Enum/mode_paiement.js'

export default class PaymentMethodTemplate extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare type: Modepaiement

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column()
  declare imageUrl: string

  @column()
  declare isActive: boolean

  @column()
  declare displayOrder: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}

