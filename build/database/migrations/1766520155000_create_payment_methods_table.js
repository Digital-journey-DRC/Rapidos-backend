import { BaseSchema } from '@adonisjs/lucid/schema';
import { Modepaiement } from '../../app/Enum/mode_paiement.js';
export default class extends BaseSchema {
    tableName = 'payment_methods';
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id').primary();
            table
                .integer('vendeur_id')
                .unsigned()
                .references('id')
                .inTable('users')
                .onDelete('CASCADE')
                .notNullable();
            table
                .string('type', 50)
                .notNullable()
                .defaultTo(Modepaiement.ORANGEMONEY);
            table.string('numero_compte', 50).notNullable();
            table.string('nom_titulaire', 100).nullable();
            table.boolean('is_default').defaultTo(false).notNullable();
            table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now());
            table.timestamp('updated_at', { useTz: true }).nullable();
            table.index(['vendeur_id']);
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
//# sourceMappingURL=1766520155000_create_payment_methods_table.js.map