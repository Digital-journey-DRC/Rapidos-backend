import { BaseSchema } from '@adonisjs/lucid/schema'
import { ProductCategory } from '../../app/Enum/product_category.js'

export default class extends BaseSchema {
  protected tableName = 'products'

  async up() {
    const exists = await this.schema.hasTable(this.tableName)
    if (exists) {
      return
    }
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('name').notNullable()
      table.text('description').notNullable()
      table.float('price').notNullable()
      table.integer('stock').notNullable()
      table
        .enum('category', Object.values(ProductCategory))
        .notNullable()
        .defaultTo(ProductCategory.ART)
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
