import { BaseSchema } from '@adonisjs/lucid/schema';
export default class extends BaseSchema {
    tableName = 'cloudinary_configs';
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table.string('name').notNullable().defaultTo('default');
            table.string('cloud_name').notNullable();
            table.string('api_key').notNullable();
            table.string('api_secret').notNullable();
            table.boolean('is_active').defaultTo(true);
            table.timestamp('created_at');
            table.timestamp('updated_at');
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
//# sourceMappingURL=1767639346411_create_cloudinary_configs_table.js.map