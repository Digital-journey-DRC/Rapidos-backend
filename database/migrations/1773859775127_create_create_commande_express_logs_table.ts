import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'commande_express_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('log_id', 255).notNullable().unique()
      table.string('order_id', 255).notNullable()
      table.string('old_status', 50).nullable()
      table.string('new_status', 50).notNullable()
      table.integer('changed_by').unsigned().notNullable()
      table.string('changed_by_role', 50).notNullable()
      table.text('reason').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.index('order_id')
      table.index('changed_by')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}