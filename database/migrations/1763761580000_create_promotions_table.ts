import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'promotions'

  async up() {
    const exists = await this.schema.hasTable(this.tableName)
    if (exists) {
      return
    }
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Référence au produit existant
      table
        .integer('product_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('products')
        .onDelete('CASCADE')

      // Image principale
      table.string('image').notNullable()

      // 4 images secondaires (utiliser snake_case pour correspondre à Lucid)
      table.string('image_1').nullable()
      table.string('image_2').nullable()
      table.string('image_3').nullable()
      table.string('image_4').nullable()

      // Libellé de la promotion
      table.string('libelle').notNullable()

      // Nombre de j'aime
      table.integer('likes').defaultTo(0)

      // Délai de promotion (date de fin)
      table.dateTime('delai_promotion').notNullable()

      // Nouveau prix
      table.float('nouveau_prix').notNullable()

      // Ancien prix
      table.float('ancien_prix').notNullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

