import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Product from './product.js'

export default class Promotion extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare productId: number

  @column()
  declare image: string

  @column({ columnName: 'image_1' })
  declare image1: string | null

  @column({ columnName: 'image_2' })
  declare image2: string | null

  @column({ columnName: 'image_3' })
  declare image3: string | null

  @column({ columnName: 'image_4' })
  declare image4: string | null

  @column()
  declare libelle: string

  @column()
  declare likes: number

  @column.dateTime()
  declare dateDebutPromotion: DateTime | null

  @column.dateTime()
  declare delaiPromotion: DateTime

  @column()
  declare nouveauPrix: number

  @column()
  declare ancienPrix: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Product, {
    foreignKey: 'productId',
  })
  declare product: BelongsTo<typeof Product>
}

