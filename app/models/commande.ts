import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasOne, manyToMany } from '@adonisjs/lucid/orm'

import type { BelongsTo, HasOne, ManyToMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Product from './product.js'
import Paiement from './paiement.js'
import { StatusCommande } from '../Enum/status_commande.js'

export default class Commande extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare totalPrice: number

  @column()
  declare status: StatusCommande

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @hasOne(() => Paiement, {
    foreignKey: 'commandeId',
    localKey: 'id',
  })
  declare paiement: HasOne<typeof Paiement>

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
