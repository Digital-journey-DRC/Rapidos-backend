import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Product from './product.js'

export default class Promotion extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'product_id' })
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

  @column.dateTime({ columnName: 'date_debut_promotion' })
  declare dateDebutPromotion: DateTime | null

  @column.dateTime({ columnName: 'delai_promotion' })
  declare delaiPromotion: DateTime

  @column({ columnName: 'nouveau_prix' })
  declare nouveauPrix: number

  @column({ columnName: 'ancien_prix' })
  declare ancienPrix: number

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime

  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>
}

