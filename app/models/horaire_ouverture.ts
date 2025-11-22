import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import User from './user.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class HoraireOuverture extends BaseModel {
  static table = 'horaires_ouverture'
  static schema = 'public'
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare vendeurId: number

  @column()
  declare jour: string // 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'

  @column()
  declare heureOuverture: string | null // Format HH:MM

  @column()
  declare heureFermeture: string | null // Format HH:MM

  @column()
  declare estOuvert: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User, {
    foreignKey: 'vendeurId',
  })
  declare vendeur: BelongsTo<typeof User>
}

