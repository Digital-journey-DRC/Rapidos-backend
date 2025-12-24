import { BaseSchema } from '@adonisjs/lucid/schema';
export default class extends BaseSchema {
    tableName = 'commande_products';
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table
                .integer('commande_id')
                .notNullable()
                .unsigned()
                .references('id')
                .inTable('commandes')
                .onDelete('CASCADE');
            table
                .integer('product_id')
                .notNullable()
                .unsigned()
                .references('id')
                .inTable('products')
                .onDelete('CASCADE');
            table.unique(['commande_id', 'product_id']);
            table.index(['commande_id', 'product_id']);
            table.integer('quantity').notNullable();
            table.float('price').notNullable();
            table.timestamp('created_at');
            table.timestamp('updated_at');
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
//# sourceMappingURL=1745948608171_create_commande_products_table.js.map