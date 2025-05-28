import { BaseSchema } from '@adonisjs/lucid/schema'

export default class AlterLivraisonLivreurIdNullable extends BaseSchema {
  protected tableName = 'livraisons'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('livreur_id').unsigned().nullable().alter()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('livreur_id').unsigned().notNullable().alter()
    })
  }
}
