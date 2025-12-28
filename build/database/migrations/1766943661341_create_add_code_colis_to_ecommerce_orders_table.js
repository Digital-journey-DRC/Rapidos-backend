import { BaseSchema } from '@adonisjs/lucid/schema';
export default class extends BaseSchema {
    tableName = 'ecommerce_orders';
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.string('code_colis', 4).nullable();
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('code_colis');
        });
    }
}
//# sourceMappingURL=1766943661341_create_add_code_colis_to_ecommerce_orders_table.js.map