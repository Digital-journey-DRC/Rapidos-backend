import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import { Modepaiement } from '../Enum/mode_paiement.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Commande from './commande.js'

export default class Paiement extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare commandeId: number

  @column()
  declare montant: number

  @column()
  declare modePaiement: Modepaiement

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Commande)
  declare commande: BelongsTo<typeof Commande>
}
