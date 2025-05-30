import { BaseSchema } from '@adonisjs/lucid/schema';
export default class extends BaseSchema {
    tableName = 'adresses';
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.string('quartier').nullable();
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.integer('quartier').nullable();
        });
    }
}
//# sourceMappingURL=1748615767771_create_add_column_quartier_to_adresses_table.js.map