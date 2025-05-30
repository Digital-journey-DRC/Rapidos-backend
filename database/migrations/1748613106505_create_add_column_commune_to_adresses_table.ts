import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'adresses'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('commune').nullable()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('commune').nullable()
    })
  }
}
