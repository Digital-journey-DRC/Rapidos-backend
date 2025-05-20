import { BaseSchema } from '@adonisjs/lucid/schema';
export default class extends BaseSchema {
    tableName = 'users';
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.string('secure_otp', 6).nullable();
            table.timestamp('otp_expired_at', { useTz: true }).nullable();
            table.boolean('terms_accepted').notNullable().defaultTo(false);
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('secure_otp');
            table.dropColumn('otp_expired_at');
            table.dropColumn('terms_accepted');
        });
    }
}
//# sourceMappingURL=1747677377532_create_add_missing_column_to_users_table.js.map