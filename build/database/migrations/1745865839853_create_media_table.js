import { BaseSchema } from '@adonisjs/lucid/schema';
export default class extends BaseSchema {
    tableName = 'media';
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table.text('media_url').notNullable();
            table.string('media_type').notNullable();
            table.timestamp('created_at');
            table.timestamp('updated_at');
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
//# sourceMappingURL=1745865839853_create_media_table.js.map