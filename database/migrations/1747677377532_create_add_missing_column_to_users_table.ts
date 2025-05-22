import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    const exists = await this.schema.hasTable(this.tableName)
    if (exists) {
      return
    }
    this.schema.alterTable(this.tableName, (table) => {
      table.string('secure_otp', 6).nullable()
      table.timestamp('otp_expired_at', { useTz: true }).nullable()
      table.boolean('terms_accepted').notNullable().defaultTo(false)
      // Ajoute ici d'autres colonnes si besoin
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('secure_otp')
      table.dropColumn('otp_expired_at')
      table.dropColumn('terms_accepted')
      // Supprime ici d'autres colonnes si besoin
    })
  }
}
