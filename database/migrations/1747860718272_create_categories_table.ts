import { BaseSchema } from '@adonisjs/lucid/schema'
import { ProductCategory } from '../../app/Enum/product_category.js'

export default class extends BaseSchema {
  protected tableName = 'categories'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.enum('name', Object.values(ProductCategory)).defaultTo(ProductCategory.ACCESSORIES)
      table.text('description').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
