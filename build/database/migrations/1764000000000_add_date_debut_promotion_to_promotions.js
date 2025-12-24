import { BaseSchema } from '@adonisjs/lucid/schema';
export default class extends BaseSchema {
    tableName = 'promotions';
    async up() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dateTime('date_debut_promotion').nullable().after('delai_promotion');
        });
    }
    async down() {
        this.schema.alterTable(this.tableName, (table) => {
            table.dropColumn('date_debut_promotion');
        });
    }
}
//# sourceMappingURL=1764000000000_add_date_debut_promotion_to_promotions.js.map