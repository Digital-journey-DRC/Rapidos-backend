import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'horaires_ouverture'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('vendeur_id').unsigned().notNullable()
      table.string('jour').notNullable() // 'lundi', 'mardi', etc.
      table.time('heure_ouverture').nullable()
      table.time('heure_fermeture').nullable()
      table.boolean('est_ouvert').defaultTo(false)
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()

      table.foreign('vendeur_id').references('id').inTable('users').onDelete('CASCADE')
      table.unique(['vendeur_id', 'jour']) // Un seul horaire par jour par vendeur
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

