import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, manyToMany } from '@adonisjs/lucid/orm'

import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Product from './product.js'

export default class Commande extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare totalPrice: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @manyToMany(() => Product, {
    pivotTable: 'commande_products',
    localKey: 'id',
    relatedKey: 'id',
    pivotForeignKey: 'commande_id',
    pivotRelatedForeignKey: 'product_id',
    pivotColumns: ['quantity', 'price'],
  })
  declare products: ManyToMany<typeof Product>
}
