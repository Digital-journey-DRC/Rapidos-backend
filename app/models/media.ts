import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import Profil from './profil.js'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Product from './product.js'

export default class Media extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare mediaUrl: string

  @column()
  declare mediaType: string

  @column({ columnName: 'product_id' })
  declare productId: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => Profil, {
    foreignKey: 'mediaId',
    localKey: 'id',
  })
  declare profil: HasMany<typeof Profil>

  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>
}
