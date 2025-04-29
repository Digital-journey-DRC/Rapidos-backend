import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'livraisons'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('commande_id')
        .unsigned()
        .references('id')
        .inTable('commandes')
        .onDelete('CASCADE')
      table
        .integer('adresse_id')
        .unsigned()
        .references('id')
        .inTable('adresses')
        .onDelete('CASCADE')
      table.integer('livreur_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table
        .enu('statut', ['en_attente', 'en_cours', 'livree'], {
          useNative: true,
          enumName: 'status_commande',
        })
        .defaultTo('en_attente')
      table
        .integer('commentaire_id')
        .unsigned()
        .references('id')
        .inTable('evaluations')
        .onDelete('SET NULL')
      table.string('code_livraison').nullable()
      table.string('numero_suivi').nullable()
      table.float('frais_livraison').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
