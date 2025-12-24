import { BaseSchema } from '@adonisjs/lucid/schema';
export default class extends BaseSchema {
    tableName = 'ecommerce_orders';
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id').primary();
            table.string('order_id').notNullable().unique();
            table.string('status').notNullable().defaultTo('pending');
            table.integer('client_id').unsigned().notNullable();
            table.string('client').notNullable();
            table.string('phone').notNullable();
            table.integer('vendor_id').unsigned().notNullable();
            table.integer('delivery_person_id').unsigned().nullable();
            table.json('items').notNullable();
            table.json('address').notNullable();
            table.decimal('total', 10, 2).notNullable();
            table.string('package_photo').nullable();
            table.string('package_photo_public_id').nullable();
            table.timestamp('created_at', { useTz: true }).notNullable();
            table.timestamp('updated_at', { useTz: true }).notNullable();
            table.index('order_id');
            table.index('client_id');
            table.index('vendor_id');
            table.index('delivery_person_id');
            table.index('status');
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
//# sourceMappingURL=1766326529972_create_create_ecommerce_orders_table.js.map