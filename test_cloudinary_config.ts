import CloudinaryConfig from '#models/cloudinary_config'
import db from '@adonisjs/lucid/services/db'
import { initCloudinaryFromDB } from '#services/cloudinary'

async function testCloudinaryConfig() {
  try {
    console.log('🔍 Vérification configuration Cloudinary...')
    
    // Tester la connexion à la base de données
    await db.rawQuery('SELECT 1')
    console.log('✅ Connexion BD OK')
    
    // Charger la configuration Cloudinary
    const config = await CloudinaryConfig.query()
      .where('is_active', true)
      .orderBy('id', 'desc')
      .first()
    
    if (config) {
      console.log('✅ Configuration Cloudinary trouvée:')
      console.log('   Cloud Name:', config.cloudName)
      console.log('   API Key:', config.apiKey ? '***' + config.apiKey.slice(-4) : 'Non défini')
      console.log('   API Secret:', config.apiSecret ? '***' + config.apiSecret.slice(-4) : 'Non défini')
      console.log('   Active:', config.isActive)
    } else {
      console.log('❌ Aucune configuration Cloudinary active trouvée en BD')
    }
    
    // Initialiser Cloudinary
    await initCloudinaryFromDB()
    console.log('✅ Cloudinary initialisé')
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
    console.error(error.stack)
  } finally {
    process.exit(0)
  }
}

testCloudinaryConfig()
