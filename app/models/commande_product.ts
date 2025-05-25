import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import Commande from './commande.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Product from './product.js'

export default class CommandeProduct extends BaseModel {
  public static table = 'commande_products'
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare commandeId: number

  @column()
  declare productId: number
  @column()
  declare quantity: number
  @column()
  declare price: number
  @column()
  declare totalUnitaire: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Commande)
  declare commande: BelongsTo<typeof Commande>

  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>
}
