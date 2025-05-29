import { BaseSchema } from '@adonisjs/lucid/schema';
export default class extends BaseSchema {
    tableName = 'evaluations';
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table.integer('note').notNullable();
            table.string('commentaire').nullable();
            table
                .integer('livraison_id')
                .unsigned()
                .references('id')
                .inTable('livraisons')
                .onDelete('CASCADE');
            table.integer('acheteur_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
            table.index(['livraison_id', 'acheteur_id']);
            table.unique(['livraison_id', 'acheteur_id']);
            table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now());
            table.timestamp('updated_at');
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
//# sourceMappingURL=1745951522074_create_evaluations_table.js.map