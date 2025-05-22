import { BaseSchema } from '@adonisjs/lucid/schema'

export default class UpdateCategoryColumnInProducts extends BaseSchema {
  protected tableName = 'products'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Supprimer l'ancienne colonne string "category"
      table.dropColumn('category')

      // Ajouter la nouvelle colonne "categorie_id" avec clé étrangère
      table
        .integer('categorie_id')
        .unsigned()
        .references('id')
        .inTable('categories')
        .onDelete('CASCADE') // ou SET NULL si tu préfères
        .nullable()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      // Restaurer la colonne "category"
      table.string('category').nullable()

      // Supprimer la nouvelle colonne "categorie_id"
      table.dropColumn('categorie_id')
    })
  }
}
