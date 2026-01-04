import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'ecommerce_orders'

  async up() {
    // Vérifier si la colonne existe déjà
    const hasColumn = await this.schema.hasColumn(this.tableName, 'firebase_order_id')
    if (!hasColumn) {
      this.schema.alterTable(this.tableName, (table) => {
        table.string('firebase_order_id', 255).nullable()
      })
    }
  }

  async down() {
    const hasColumn = await this.schema.hasColumn(this.tableName, 'firebase_order_id')
    if (hasColumn) {
      this.schema.alterTable(this.tableName, (table) => {
        table.dropColumn('firebase_order_id')
      })
    }
  }
}