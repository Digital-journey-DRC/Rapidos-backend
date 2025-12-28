import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'ecommerce_orders'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.decimal('latitude', 10, 8).nullable()
      table.decimal('longitude', 11, 8).nullable()
      table.decimal('distance_km', 10, 2).nullable()
      table.integer('delivery_fee').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('latitude')
      table.dropColumn('longitude')
      table.dropColumn('distance_km')
      table.dropColumn('delivery_fee')
    })
  }
}