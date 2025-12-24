import { BaseSchema } from '@adonisjs/lucid/schema';
export default class extends BaseSchema {
    tableName = 'payment_methods';
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.boolean('is_active').defaultTo(true).notNullable().after('is_default');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('is_active');
        });
    }
}
//# sourceMappingURL=1766530000000_add_is_active_to_payment_methods.js.map