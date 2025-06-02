import { BaseSchema } from '@adonisjs/lucid/schema';
import { Modepaiement } from '../../app/Enum/mode_paiement.js';
export default class extends BaseSchema {
    tableName = 'paiements';
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table
                .integer('commande_id')
                .unsigned()
                .references('id')
                .inTable('commandes')
                .onDelete('CASCADE');
            table.integer('montant').notNullable();
            table
                .enum('mode_paiement', Object.values(Modepaiement))
                .notNullable()
                .defaultTo(Modepaiement.ORANGEMONEY);
            table.index(['commande_id']);
            table.timestamp('created_at');
            table.timestamp('updated_at');
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
//# sourceMappingURL=1745949218213_create_paiements_table.js.map