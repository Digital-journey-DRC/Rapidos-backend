import { v2 as cloudinary } from 'cloudinary'
import CloudinaryConfig from '#models/cloudinary_config'

// Supprimer CLOUDINARY_URL de l'environnement pour éviter l'auto-config
delete process.env.CLOUDINARY_URL

let isConfigured = false

/**
 * Charge la configuration Cloudinary depuis la base de données
 * Fallback sur les variables d'environnement si non trouvée
 */
export async function initCloudinaryFromDB(): Promise<void> {
  if (isConfigured) return

  try {
    const config = await CloudinaryConfig.query()
      .where('is_active', true)
      .orderBy('id', 'desc')
      .first()

    if (config) {
      cloudinary.config({
        cloud_name: config.cloudName,
        api_key: config.apiKey,
        api_secret: config.apiSecret,
        secure: true,
      })
      console.log('✅ Cloudinary configuré depuis la BD')
    } else {
      console.log('⚠️ Config Cloudinary non trouvée en BD, utilisation des variables d\'environnement')
    }
    isConfigured = true
  } catch (error) {
    console.log('⚠️ Erreur chargement config Cloudinary depuis BD, fallback sur env:', error.message)
    isConfigured = true
  }
}

export default cloudinary
