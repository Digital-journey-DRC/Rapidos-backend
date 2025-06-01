import { BaseSchema } from '@adonisjs/lucid/schema';
export default class AlterLivraisonLivreurIdNullable extends BaseSchema {
    tableName = 'livraisons';
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.integer('livreur_id').unsigned().nullable().alter();
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.integer('livreur_id').unsigned().notNullable().alter();
        });
    }
}
//# sourceMappingURL=1748452396852_create_make_nullable_livreur_ids_table.js.map