import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, hasMany, hasOne } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { UserRole } from '../Enum/user_role.js'
import Profil from './profil.js'
import type { HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import Adresse from './adresse.js'
import Wallet from './wallet.js'
import AccessToken from './access_token.js'

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

  @hasMany(() => Adresse)
  declare adresses: HasMany<typeof Adresse>

  @hasOne(() => Wallet)
  declare wallet: HasOne<typeof Wallet>

  @hasMany(() => AccessToken)
  declare accessTokens: HasMany<typeof AccessToken>
}
