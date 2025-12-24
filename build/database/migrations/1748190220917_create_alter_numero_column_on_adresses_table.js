import { BaseSchema } from '@adonisjs/lucid/schema';
export default class extends BaseSchema {
    tableName = 'adresses';
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.string('numero').alter();
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.integer('numero').alter();
        });
    }
}
//# sourceMappingURL=1748190220917_create_alter_numero_column_on_adresses_table.js.map