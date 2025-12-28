import db from '@adonisjs/lucid/services/db'

async function executeMigration() {
  try {
    console.log('📦 Ajout des colonnes GPS et livraison...')
    
    // Ajouter les colonnes
    await db.rawQuery('ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8) NULL')
    await db.rawQuery('ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8) NULL')
    await db.rawQuery('ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS distance_km DECIMAL(10, 2) NULL')
    await db.rawQuery('ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS delivery_fee INTEGER NULL')
    
    console.log('✅ Colonnes ajoutées avec succès')
    
    console.log('📝 Marquage de la migration comme complétée...')
    
    // Marquer la migration comme complétée
    await db.rawQuery(`
      INSERT INTO adonis_schema (name, batch) 
      VALUES ('1766934205134_create_add_gps_and_delivery_columns_to_ecommerce_orders_table', 11)
      ON CONFLICT (name) DO NOTHING
    `)
    
    console.log('✅ Migration marquée comme complétée')
    
    console.log('🧹 Nettoyage des migrations corrompues...')
    
    // Nettoyer les migrations corrompues
    await db.rawQuery(`DELETE FROM adonis_schema WHERE name = '1745865839852_create_products_table'`)
    
    console.log('✅ Migrations corrompues nettoyées')
    console.log('🎉 Toutes les opérations terminées avec succès!')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Erreur:', error.message)
    console.error(error)
    process.exit(1)
  }
}

executeMigration()
