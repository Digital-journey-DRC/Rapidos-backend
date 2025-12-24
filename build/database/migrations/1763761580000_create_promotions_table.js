import { BaseSchema } from '@adonisjs/lucid/schema';
export default class extends BaseSchema {
    tableName = 'promotions';
    async up() {
        const exists = await this.schema.hasTable(this.tableName);
        if (exists) {
            return;
        }
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table
                .integer('product_id')
                .notNullable()
                .unsigned()
                .references('id')
                .inTable('products')
                .onDelete('CASCADE');
            table.string('image').notNullable();
            table.string('image_1').nullable();
            table.string('image_2').nullable();
            table.string('image_3').nullable();
            table.string('image_4').nullable();
            table.string('libelle').notNullable();
            table.integer('likes').defaultTo(0);
            table.dateTime('delai_promotion').notNullable();
            table.float('nouveau_prix').notNullable();
            table.float('ancien_prix').notNullable();
            table.timestamp('created_at');
            table.timestamp('updated_at');
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
//# sourceMappingURL=1763761580000_create_promotions_table.js.map