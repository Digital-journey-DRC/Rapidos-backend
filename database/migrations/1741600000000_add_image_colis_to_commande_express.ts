import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'commande_express'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('image_colis', 500).nullable()
      table.string('image_colis_public_id', 500).nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('image_colis')
      table.dropColumn('image_colis_public_id')
    })
  }
}
