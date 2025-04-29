import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import Profil from './profil.js'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Product from './product.js'

export default class Media extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare mediaUrl: string

  @column()
  declare mediaType: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => Profil, {
    foreignKey: 'mediaId',
    localKey: 'id',
  })
  declare profil: HasMany<typeof Profil>

  @hasMany(() => Product, {
    foreignKey: 'mediaId',
    localKey: 'id',
  })
  declare product: HasMany<typeof Product>
}
