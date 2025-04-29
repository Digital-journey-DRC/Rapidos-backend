import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'paiements'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('commande_id')
        .unsigned()
        .references('id')
        .inTable('commandes')
        .onDelete('CASCADE')
      table.integer('montant').notNullable()
      table
        .enu('mode_paiement', ['orange_money', 'master_card'], {
          useNative: true,
          enumName: 'mode_paiement',
        })
        .notNullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
