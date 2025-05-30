import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import User from './user.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { TypeAdresse } from '../Enum/type_adresse.js'

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
  declare userId: number

  @column()
  declare codePostale: string | null

  @column()
  declare commune: string | null

  @column()
  declare isPrincipal: boolean

  @column()
  declare type: TypeAdresse

  @column()
  declare numero: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
