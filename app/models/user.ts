import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, hasOne, manyToMany } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { UserRole } from '../Enum/user_role.js'
import Profil from './profil.js'
import type { HasOne, ManyToMany } from '@adonisjs/lucid/types/relations'
import Adresse from './adresse.js'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare firstName: string | null

  @column()
  declare lastName: string | null

  @column()
  declare phone: number | null

  @column()
  declare role: UserRole

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  static accessTokens = DbAccessTokensProvider.forModel(User)

  @hasOne(() => Profil, {
    foreignKey: 'userId',
    localKey: 'id',
  })
  declare profil: HasOne<typeof Profil>

  @manyToMany(() => Adresse, {
    pivotTable: 'user_adresse',
    localKey: 'id',
    relatedKey: 'id',
    pivotForeignKey: 'user_id',
    pivotRelatedForeignKey: 'adresse_id',
    pivotColumns: ['type'],
  })
  declare adresses: ManyToMany<typeof Adresse>
}
