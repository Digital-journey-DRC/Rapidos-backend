import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'evaluations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('note').notNullable()
      table.string('commentaire').nullable()
      table
        .integer('livraison_id')
        .unsigned()
        .references('id')
        .inTable('livraisons')
        .onDelete('CASCADE')
      table.integer('acheteur_id').unsigned().references('id').inTable('users').onDelete('CASCADE')

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
