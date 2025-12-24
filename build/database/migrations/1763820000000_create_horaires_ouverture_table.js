import { BaseSchema } from '@adonisjs/lucid/schema';
export default class extends BaseSchema {
    tableName = 'horaires_ouverture';
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table.integer('vendeur_id').unsigned().notNullable();
            table.string('jour').notNullable();
            table.time('heure_ouverture').nullable();
            table.time('heure_fermeture').nullable();
            table.boolean('est_ouvert').defaultTo(false);
            table.timestamp('created_at', { useTz: true }).notNullable();
            table.timestamp('updated_at', { useTz: true }).notNullable();
            table.foreign('vendeur_id').references('id').inTable('users').onDelete('CASCADE');
            table.unique(['vendeur_id', 'jour']);
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
//# sourceMappingURL=1763820000000_create_horaires_ouverture_table.js.map