import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'products'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('name').notNullable()
      table.text('description').notNullable()
      table.float('price').notNullable()
      table.integer('stock').notNullable()
      table.string('category').notNullable()
      table
        .integer('media_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('media')
        .onDelete('CASCADE')
      table
        .integer('vendeur_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
