import { BaseSchema } from '@adonisjs/lucid/schema';
export default class extends BaseSchema {
    tableName = 'adresses';
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.string('commune').nullable();
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.integer('commune').nullable();
        });
    }
}
//# sourceMappingURL=1748613106505_create_add_column_commune_to_adresses_table.js.map