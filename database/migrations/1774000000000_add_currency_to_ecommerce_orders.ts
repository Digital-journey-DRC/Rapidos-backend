import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'ecommerce_orders'

  async up() {
    const hasColumn = await this.schema.hasColumn(this.tableName, 'currency')
    if (!hasColumn) {
      this.schema.alterTable(this.tableName, (table) => {
        table.string('currency', 10).nullable()
      })
    }
  }

  async down() {
    const hasColumn = await this.schema.hasColumn(this.tableName, 'currency')
    if (hasColumn) {
      this.schema.alterTable(this.tableName, (table) => {
        table.dropColumn('currency')
      })
    }
  }
}
