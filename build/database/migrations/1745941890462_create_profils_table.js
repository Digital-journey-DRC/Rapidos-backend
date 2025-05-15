import { BaseSchema } from '@adonisjs/lucid/schema';
export default class extends BaseSchema {
    tableName = 'profils';
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table
                .integer('user_id')
                .notNullable()
                .unsigned()
                .references('id')
                .inTable('users')
                .onDelete('CASCADE');
            table
                .integer('media_id')
                .notNullable()
                .unsigned()
                .references('id')
                .inTable('media')
                .onDelete('CASCADE');
            table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now());
            table.timestamp('updated_at', { useTz: true }).nullable().defaultTo(this.now());
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
//# sourceMappingURL=1745941890462_create_profils_table.js.map