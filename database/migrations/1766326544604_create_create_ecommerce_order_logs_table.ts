import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'ecommerce_order_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('log_id').notNullable().unique()
      table.string('order_id').notNullable()
      table.string('old_status').notNullable()
      table.string('new_status').notNullable()
      table.integer('changed_by').unsigned().notNullable()
      table.string('changed_by_role').notNullable()
      table.text('reason').nullable()
      table.timestamp('timestamp', { useTz: true }).notNullable().defaultTo(this.now())

      // Index pour performance
      table.index('order_id')
      table.index('changed_by')
      table.index('timestamp')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}