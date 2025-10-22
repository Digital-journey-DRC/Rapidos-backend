import { BaseSchema } from '@adonisjs/lucid/schema';
import { UserStatus } from '../../app/Enum/user_status.js';
export default class extends BaseSchema {
    tableName = 'users';
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.enum('user_status', Object.values(UserStatus)).defaultTo(UserStatus.PENDING).nullable();
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('user_status');
        });
    }
}
//# sourceMappingURL=1750872604249_create_add_user_status_to_users_table.js.map