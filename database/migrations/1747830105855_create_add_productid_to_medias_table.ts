import { BaseSchema } from '@adonisjs/lucid/schema'

export default class AlterMediasAddProductId extends BaseSchema {
  protected tableName = 'media'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('product_id')
        .unsigned()
        .references('id')
        .inTable('products')
        .onDelete('CASCADE')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropForeign(['product_id'])
      table.dropColumn('product_id')
    })
  }
}
