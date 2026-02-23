import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'commande_express'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('order_id', 255).notNullable().unique()
      table.integer('client_id').unsigned().notNullable()
      table.string('client_name', 255).notNullable()
      table.string('client_phone', 50).notNullable()
      table.decimal('package_value', 10, 2).notNullable()
      table.text('package_description').notNullable()
      table.text('pickup_address').notNullable()
      table.text('delivery_address').notNullable()
      table.string('pickup_reference', 255).nullable()
      table.string('delivery_reference', 255).nullable()
      table.integer('created_by').unsigned().notNullable()
      table.string('statut', 50).notNullable().defaultTo('pending')
      table.json('items').notNullable()
      table.integer('delivery_person_id').unsigned().nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()

      // Index pour améliorer les performances
      table.index('order_id')
      table.index('client_id')
      table.index('statut')
      table.index('delivery_person_id')
      table.index('created_by')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
