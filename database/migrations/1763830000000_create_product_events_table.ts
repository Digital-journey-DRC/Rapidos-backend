import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'product_events'

  async up() {
    const exists = await this.schema.hasTable(this.tableName)
    if (exists) {
      return
    }

    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // User ID (nullable pour les utilisateurs non connectés)
      table
        .integer('user_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')

      // Product ID (nullable pour les events de type "search")
      table
        .integer('product_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('products')
        .onDelete('SET NULL')

      // Category ID (nullable si pas applicable)
      table
        .integer('product_category_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('categories')
        .onDelete('SET NULL')

      // Category name (snapshot au moment de l'event)
      table.string('product_category_name').nullable()

      // Type d'événement
      table
        .string('event_type')
        .notNullable()
        .checkIn(['view_product', 'add_to_cart', 'add_to_wishlist', 'purchase', 'search'])

      // Search query (uniquement pour l'event "search")
      table.text('search_query').nullable()

      // Metadata JSON (optionnel)
      table.jsonb('metadata').nullable()

      // Timestamp
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())

      // Index pour améliorer les performances des requêtes
      table.index(['user_id', 'created_at'], 'idx_product_events_user_created')
      table.index(['product_id', 'created_at'], 'idx_product_events_product_created')
      table.index(['event_type', 'created_at'], 'idx_product_events_type_created')
      table.index(['product_category_id', 'created_at'], 'idx_product_events_category_created')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

