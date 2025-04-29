import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import Livraison from './livraison.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'

export default class Evaluation extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare note: number
  @column()
  declare commentaire: string | null
  @column()
  declare livraisonId: number
  @column()
  declare acheteurId: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Define any relationships here if needed

  @belongsTo(() => Livraison)
  declare livraison: BelongsTo<typeof Livraison>

  @belongsTo(() => User)
  declare acheteur: BelongsTo<typeof User>
}
