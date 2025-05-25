import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'adresses'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('code_postal', 'code_postale')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('code_postal', 'code_postale')
    })
  }
}
