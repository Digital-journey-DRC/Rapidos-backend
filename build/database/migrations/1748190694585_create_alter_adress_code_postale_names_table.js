import { BaseSchema } from '@adonisjs/lucid/schema';
export default class extends BaseSchema {
    tableName = 'adresses';
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.renameColumn('code_postal', 'code_postale');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.renameColumn('code_postal', 'code_postale');
        });
    }
}
//# sourceMappingURL=1748190694585_create_alter_adress_code_postale_names_table.js.map