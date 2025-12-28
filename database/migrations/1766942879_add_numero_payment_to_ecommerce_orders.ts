import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'ecommerce_orders'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('numero_payment', 255).nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('numero_payment')
    })
  }
}
