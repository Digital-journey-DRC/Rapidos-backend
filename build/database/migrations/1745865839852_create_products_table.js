import { BaseSchema } from '@adonisjs/lucid/schema';
import { ProductCategory } from '../../app/Enum/product_category.js';
export default class extends BaseSchema {
    tableName = 'products';
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table.string('name').notNullable();
            table.text('description').notNullable();
            table.float('price').notNullable();
            table.integer('stock').notNullable();
            table
                .enum('category', Object.values(ProductCategory))
                .notNullable()
                .defaultTo(ProductCategory.ART);
            table
                .integer('vendeur_id')
                .notNullable()
                .unsigned()
                .references('id')
                .inTable('users')
                .onDelete('CASCADE');
            table.timestamp('created_at');
            table.timestamp('updated_at');
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
//# sourceMappingURL=1745865839852_create_products_table.js.map