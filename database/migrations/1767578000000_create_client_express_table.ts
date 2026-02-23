import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'client_express'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('name', 255).notNullable()
      table.string('phone', 50).notNullable()
      table.string('email', 255).nullable()
      table.text('default_address').nullable()
      table.string('default_reference', 255).nullable()
      table.integer('vendor_id').unsigned().notNullable()
      table.text('notes').nullable()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      // Index pour optimiser les recherches
      table.index('vendor_id', 'idx_client_express_vendor_id')
      table.index('phone', 'idx_client_express_phone')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
