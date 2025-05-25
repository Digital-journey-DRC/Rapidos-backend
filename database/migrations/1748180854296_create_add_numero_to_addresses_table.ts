import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'adresses'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('numero')
        .unsigned()
        .notNullable()
        .defaultTo(0)
        .after('id') // Adjust the position if necessary
        .comment(
          "Numero de l'adresse, par exemple le numéro de la maison ou de l'appartement sur une avenue"
        )
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('numero')
    })
  }
}
