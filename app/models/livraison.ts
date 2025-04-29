import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import { StatusCommande } from '../Enum/status_commande.js'
import Commande from './commande.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Evaluation from './evaluation.js'

export default class Livraison extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare commandeId: number
  @column()
  declare adresseId: number

  @column()
  declare livreurId: number
  @column()
  declare statut: StatusCommande

  @column()
  declare commentaireId: number | null
  @column()
  declare codeLivraison: string | null
  @column()
  declare numeroSuivi: string | null
  @column()
  declare fraisLivraison: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Define any relationships here if needed

  @belongsTo(() => Commande)
  declare commande: BelongsTo<typeof Commande>

  @belongsTo(() => User)
  declare livreur: BelongsTo<typeof User>
  @belongsTo(() => Evaluation)
  declare evaluation: BelongsTo<typeof Evaluation>
}
