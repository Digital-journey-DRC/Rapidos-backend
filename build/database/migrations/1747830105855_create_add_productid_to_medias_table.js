import { BaseSchema } from '@adonisjs/lucid/schema';
export default class AlterMediasAddProductId extends BaseSchema {
    tableName = 'media';
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table
                .integer('product_id')
                .unsigned()
                .references('id')
                .inTable('products')
                .onDelete('CASCADE');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropForeign(['product_id']);
            table.dropColumn('product_id');
        });
    }
}
//# sourceMappingURL=1747830105855_create_add_productid_to_medias_table.js.map