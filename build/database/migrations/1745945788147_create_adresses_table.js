import { BaseSchema } from '@adonisjs/lucid/schema';
import { TypeAdresse } from '../../app/Enum/type_adresse.js';
export default class extends BaseSchema {
    tableName = 'adresses';
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table.string('avenue').notNullable();
            table.string('ville').notNullable();
            table.string('pays').notNullable();
            table.string('code_postal').nullable();
            table.boolean('is_principal').notNullable().defaultTo(false);
            table
                .integer('user_id')
                .notNullable()
                .unsigned()
                .references('id')
                .inTable('users')
                .onDelete('CASCADE');
            table.enum('type', Object.values(TypeAdresse)).notNullable().defaultTo(TypeAdresse.DOMICILE);
            table.timestamp('created_at');
            table.timestamp('updated_at');
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
//# sourceMappingURL=1745945788147_create_adresses_table.js.map