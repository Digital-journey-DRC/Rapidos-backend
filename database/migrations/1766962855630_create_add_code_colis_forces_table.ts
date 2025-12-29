import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'ecommerce_orders'

  async up() {
    // Utiliser raw query pour éviter les erreurs si la colonne existe déjà
    this.schema.raw('ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS code_colis VARCHAR(4) NULL')
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('code_colis')
    })
  }
}