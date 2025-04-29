import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import User from './user.js'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'

export default class Adresse extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare avenue: string

  @column()
  declare quartier: string

  @column()
  declare ville: string

  @column()
  declare pays: string

  @column()
  declare codePostal: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @manyToMany(() => User, {
    pivotTable: 'user_adresse',
    localKey: 'id',
    relatedKey: 'id',
    pivotForeignKey: 'adresse_id',
    pivotRelatedForeignKey: 'user_id',
    pivotColumns: ['type'],
  })
  declare users: ManyToMany<typeof User>
}
