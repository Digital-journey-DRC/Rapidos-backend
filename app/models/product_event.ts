import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import User from './user.js'
import Product from './product.js'
import Category from './category.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { EventType } from '../Enum/event_type.js'

export default class ProductEvent extends BaseModel {
  static table = 'product_events'
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number | null

  @column()
  declare productId: number | null

  @column()
  declare productCategoryId: number | null

  @column()
  declare productCategoryName: string | null

  @column()
  declare eventType: EventType

  @column()
  declare searchQuery: string | null

  @column({
    prepare: (value: any) => (value ? JSON.stringify(value) : null),
    consume: (value: any) => (value ? (typeof value === 'string' ? JSON.parse(value) : value) : null),
  })
  declare metadata: Record<string, any> | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Product, {
    foreignKey: 'productId',
  })
  declare product: BelongsTo<typeof Product>

  @belongsTo(() => Category, {
    foreignKey: 'productCategoryId',
  })
  declare category: BelongsTo<typeof Category>
}

