import { BaseSchema } from '@adonisjs/lucid/schema';
export default class extends BaseSchema {
    tableName = 'users';
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.decimal('latitude', 10, 8).nullable();
            table.decimal('longitude', 11, 8).nullable();
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('latitude');
            table.dropColumn('longitude');
        });
    }
}
//# sourceMappingURL=1766700000000_add_latitude_longitude_to_users_table.js.map