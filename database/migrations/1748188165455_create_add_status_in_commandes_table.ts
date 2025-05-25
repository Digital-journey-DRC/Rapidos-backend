import { BaseSchema } from '@adonisjs/lucid/schema'
import { StatusCommande } from '../../app/Enum/status_commande.js'

export default class extends BaseSchema {
  protected tableName = 'commandes'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.enum('status', Object.values(StatusCommande)).defaultTo(StatusCommande.EN_ATTENTE)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('status')
    })
  }
}
