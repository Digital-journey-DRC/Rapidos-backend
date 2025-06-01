import { BaseSchema } from '@adonisjs/lucid/schema';
export default class extends BaseSchema {
    tableName = 'adresses';
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table
                .integer('numero')
                .unsigned()
                .notNullable()
                .defaultTo(0)
                .after('id')
                .comment("Numero de l'adresse, par exemple le numéro de la maison ou de l'appartement sur une avenue");
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('numero');
        });
    }
}
//# sourceMappingURL=1748180854296_create_add_numero_to_addresses_table.js.map