import { BaseSchema } from '@adonisjs/lucid/schema';
export default class extends BaseSchema {
    tableName = 'commande_products';
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.float('total_unitaire').notNullable().defaultTo(0);
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('total_unitaire');
        });
    }
}
//# sourceMappingURL=1748184747257_create_add_total_unitaire_to_commande_products_table.js.map