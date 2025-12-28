import { BaseCommand } from '@adonisjs/core/ace';
export default class ExecuteMigrationSql extends BaseCommand {
    static commandName = 'execute:migration-sql';
    static description = 'Exécuter manuellement la migration GPS et livraison';
    static options = {};
    async run() {
        try {
            this.logger.info('📦 Ajout des colonnes GPS et livraison...');
            const Database = (await import('@adonisjs/lucid/services/db')).default;
            await Database.rawQuery('ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8) NULL');
            await Database.rawQuery('ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8) NULL');
            await Database.rawQuery('ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS distance_km DECIMAL(10, 2) NULL');
            await Database.rawQuery('ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS delivery_fee INTEGER NULL');
            this.logger.success('✅ Colonnes ajoutées avec succès');
            this.logger.info('📝 Marquage de la migration comme complétée...');
            await Database.rawQuery(`
        INSERT INTO adonis_schema (name, batch) 
        VALUES ('1766934205134_create_add_gps_and_delivery_columns_to_ecommerce_orders_table', 11)
        ON CONFLICT (name) DO NOTHING
      `);
            this.logger.success('✅ Migration marquée comme complétée');
            this.logger.info('🧹 Nettoyage des migrations corrompues...');
            await Database.rawQuery(`DELETE FROM adonis_schema WHERE name = '1745865839852_create_products_table'`);
            this.logger.success('✅ Migrations corrompues nettoyées');
            this.logger.success('🎉 Toutes les opérations terminées avec succès!');
        }
        catch (error) {
            this.logger.error('❌ Erreur:', error.message);
            throw error;
        }
    }
}
//# sourceMappingURL=execute_migration_sql_manual.js.map