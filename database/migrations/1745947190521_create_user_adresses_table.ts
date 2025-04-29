import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'user_adresses'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('user_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table
        .integer('adresse_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('adresses')
        .onDelete('CASCADE')

      table
        .enu('type', ['domicile', 'livraison'], {
          useNative: true,
          enumName: 'type_adresse',
        })
        .notNullable().defaultTo

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
