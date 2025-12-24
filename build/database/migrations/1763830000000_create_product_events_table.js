import { BaseSchema } from '@adonisjs/lucid/schema';
export default class extends BaseSchema {
    tableName = 'product_events';
    async up() {
        const exists = await this.schema.hasTable(this.tableName);
        if (exists) {
            return;
        }
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table
                .integer('user_id')
                .unsigned()
                .nullable()
                .references('id')
                .inTable('users')
                .onDelete('SET NULL');
            table
                .integer('product_id')
                .unsigned()
                .nullable()
                .references('id')
                .inTable('products')
                .onDelete('SET NULL');
            table
                .integer('product_category_id')
                .unsigned()
                .nullable()
                .references('id')
                .inTable('categories')
                .onDelete('SET NULL');
            table.string('product_category_name').nullable();
            table
                .string('event_type')
                .notNullable()
                .checkIn(['view_product', 'add_to_cart', 'add_to_wishlist', 'purchase', 'search']);
            table.text('search_query').nullable();
            table.jsonb('metadata').nullable();
            table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now());
            table.index(['user_id', 'created_at'], 'idx_product_events_user_created');
            table.index(['product_id', 'created_at'], 'idx_product_events_product_created');
            table.index(['event_type', 'created_at'], 'idx_product_events_type_created');
            table.index(['product_category_id', 'created_at'], 'idx_product_events_category_created');
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
//# sourceMappingURL=1763830000000_create_product_events_table.js.map