import { BaseCommand } from '@adonisjs/core/ace';
export default class ExecuteMigrationManual extends BaseCommand {
    static commandName = 'execute:migration-manual';
    static description = 'Exécuter manuellement la migration SQL via AdonisJS';
    static options = {};
    async run() {
        try {
            this.logger.info('🔌 Connexion à la base de données via AdonisJS...');
            const db = await this.app.container.make('lucid.db');
            await db.rawQuery('SELECT 1');
            this.logger.success('✅ Connecté!\n');
            this.logger.info('📦 Ajout de la colonne payment_method_id...');
            await db.rawQuery('ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS payment_method_id INTEGER NULL');
            const constraintCheck = await db.rawQuery(`
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_ecommerce_orders_payment_method_id'
      `);
            if (constraintCheck.rows.length === 0) {
                this.logger.info('📦 Ajout de la contrainte foreign key...');
                await db.rawQuery(`
          ALTER TABLE ecommerce_orders 
          ADD CONSTRAINT fk_ecommerce_orders_payment_method_id 
          FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE SET NULL
        `);
            }
            this.logger.success('✅ payment_method_id ajouté');
            this.logger.info('📦 Ajout des colonnes GPS et livraison...');
            await db.rawQuery('ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8) NULL');
            await db.rawQuery('ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8) NULL');
            await db.rawQuery('ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS distance_km DECIMAL(10, 2) NULL');
            await db.rawQuery('ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS delivery_fee INTEGER NULL');
            this.logger.success('✅ Colonnes GPS ajoutées');
            this.logger.info('📝 Marquage des migrations...');
            await db.rawQuery(`
        INSERT INTO adonis_schema (name, batch) 
        SELECT '1766531000000_add_payment_method_id_to_ecommerce_orders', 11
        WHERE NOT EXISTS (
          SELECT 1 FROM adonis_schema 
          WHERE name = '1766531000000_add_payment_method_id_to_ecommerce_orders'
        )
      `);
            await db.rawQuery(`
        INSERT INTO adonis_schema (name, batch) 
        SELECT '1766934205134_create_add_gps_and_delivery_columns_to_ecommerce_orders_table', 11
        WHERE NOT EXISTS (
          SELECT 1 FROM adonis_schema 
          WHERE name = '1766934205134_create_add_gps_and_delivery_columns_to_ecommerce_orders_table'
        )
      `);
            this.logger.success('✅ Migrations marquées');
            this.logger.info('🧹 Nettoyage...');
            await db.rawQuery(`DELETE FROM adonis_schema WHERE name = '1745865839852_create_products_table'`);
            await db.rawQuery(`DELETE FROM adonis_schema WHERE name = '1766934205134_create_add_gps_and_delivery_columns_to_ecommerce_orders_table' AND batch = 11`);
            this.logger.success('✅ Nettoyage terminé');
            this.logger.info('🔍 Vérification des colonnes...');
            const verification = await db.rawQuery(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'ecommerce_orders' 
          AND column_name IN ('latitude', 'longitude', 'distance_km', 'delivery_fee', 'payment_method_id')
      `);
            this.logger.info('\nColonnes créées:');
            console.table(verification.rows);
            this.logger.success('\n🎉 Toutes les opérations terminées avec succès!');
        }
        catch (error) {
            this.logger.error('❌ Erreur:', error.message);
            throw error;
        }
    }
}
//# sourceMappingURL=execute_migration_manual.js.map