import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, manyToMany } from '@adonisjs/lucid/orm'
import Media from './media.js'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Commande from './commande.js'

export default class Product extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare description: string

  @column()
  declare price: number

  @column()
  declare stock: number

  @column()
  declare category: string

  @column()
  declare mediaId: number

  @column()
  declare vendeurId: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Media)
  declare media: BelongsTo<typeof Media>

  @belongsTo(() => User)
  declare vendeur: BelongsTo<typeof User>

  @manyToMany(() => Commande, {
    pivotTable: 'commande_products',
    localKey: 'id',
    relatedKey: 'id',
    pivotForeignKey: 'product_id',
    pivotRelatedForeignKey: 'commande_id',
    pivotColumns: ['quantity', 'price'],
  })
  declare commandes: ManyToMany<typeof Commande>
}
