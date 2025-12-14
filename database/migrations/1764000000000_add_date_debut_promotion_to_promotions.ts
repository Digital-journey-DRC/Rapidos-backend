import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'promotions'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Ajouter la colonne date_debut_promotion (date de début de la promotion)
      table.dateTime('date_debut_promotion').nullable().after('delai_promotion')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('date_debut_promotion')
    })
  }
}

