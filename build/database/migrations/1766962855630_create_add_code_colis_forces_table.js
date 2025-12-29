import { BaseSchema } from '@adonisjs/lucid/schema';
export default class extends BaseSchema {
    tableName = 'ecommerce_orders';
    async up() {
        this.schema.raw('ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS code_colis VARCHAR(4) NULL');
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('code_colis');
        });
    }
}
//# sourceMappingURL=1766962855630_create_add_code_colis_forces_table.js.map