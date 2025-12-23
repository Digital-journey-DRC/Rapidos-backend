import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'ecommerce_orders'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('payment_method_id')
        .unsigned()
        .references('id')
        .inTable('payment_methods')
        .onDelete('SET NULL')
        .nullable()
        .after('package_photo_public_id')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('payment_method_id')
    })
  }
}

