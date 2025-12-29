import Database from '@adonisjs/lucid/services/db'

try {
  await Database.rawQuery('ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS code_colis VARCHAR(4) NULL')
  console.log('✅ Colonne code_colis ajoutée avec succès!')
  await Database.manager.closeAll()
  process.exit(0)
} catch (error) {
  console.error('❌ Erreur:', error.message)
  process.exit(1)
}
