import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'wallets'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('user_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.float('balance', 12, 2).notNullable().defaultTo(0)
      table.enum('currency', Object.values('devise')).notNullable().defaultTo('USD')
      table.enum('status', Object.values('status_wallet')).notNullable().defaultTo('active')
      table.enum('type', Object.values('type_operation')).notNullable().defaultTo('credit')

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
