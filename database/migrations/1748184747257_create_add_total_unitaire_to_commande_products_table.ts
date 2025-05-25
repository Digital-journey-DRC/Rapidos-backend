import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'commande_products'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.float('total_unitaire').notNullable().defaultTo(0)
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('total_unitaire')
    })
  }
}
