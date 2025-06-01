import { BaseSchema } from '@adonisjs/lucid/schema';
import { StatusCommande } from '../../app/Enum/status_commande.js';
export default class extends BaseSchema {
    tableName = 'commandes';
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.enum('status', Object.values(StatusCommande)).defaultTo(StatusCommande.EN_ATTENTE);
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('status');
        });
    }
}
//# sourceMappingURL=1748188165455_create_add_status_in_commandes_table.js.map