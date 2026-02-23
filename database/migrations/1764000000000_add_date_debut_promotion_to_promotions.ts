import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'promotions'

  async up() {
    // Vérifier si la colonne existe déjà avant de l'ajouter
    const hasColumn = await this.schema.hasColumn(this.tableName, 'date_debut_promotion')
    
    if (!hasColumn) {
      this.schema.alterTable(this.tableName, (table) => {
        // Ajouter la colonne date_debut_promotion (date de début de la promotion)
        table.dateTime('date_debut_promotion').nullable()
      })
    }
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('date_debut_promotion')
    })
  }
}

