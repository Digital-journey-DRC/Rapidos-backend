import { BaseSchema } from '@adonisjs/lucid/schema';
export default class UpdateCategoryColumnInProducts extends BaseSchema {
    tableName = 'products';
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('category');
            table
                .integer('categorie_id')
                .unsigned()
                .references('id')
                .inTable('categories')
                .onDelete('CASCADE')
                .nullable();
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.string('category').nullable();
            table.dropColumn('categorie_id');
        });
    }
}
//# sourceMappingURL=1747860917081_create_add_categori_id_columns_table.js.map