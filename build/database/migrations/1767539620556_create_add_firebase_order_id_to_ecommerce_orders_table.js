import { BaseSchema } from '@adonisjs/lucid/schema';
export default class extends BaseSchema {
    tableName = 'ecommerce_orders';
    async up() {
        const hasColumn = await this.schema.hasColumn(this.tableName, 'firebase_order_id');
        if (!hasColumn) {
            this.schema.alterTable(this.tableName, (table) => {
                table.string('firebase_order_id', 255).nullable();
            });
        }
    }
    async down() {
        const hasColumn = await this.schema.hasColumn(this.tableName, 'firebase_order_id');
        if (hasColumn) {
            this.schema.alterTable(this.tableName, (table) => {
                table.dropColumn('firebase_order_id');
            });
        }
    }
}
//# sourceMappingURL=1767539620556_create_add_firebase_order_id_to_ecommerce_orders_table.js.map