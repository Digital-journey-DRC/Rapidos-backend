import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import AppSecret from '#models/app_secret'

export default class AppSecretsController {
  /**
   * GET /app-secrets/create-table
   * Créer la table app_secrets
   */
  async createTable({ response }: HttpContext) {
    try {
      await db.rawQuery(`
        CREATE TABLE IF NOT EXISTS app_secrets (
          id SERIAL PRIMARY KEY,
          key VARCHAR(255) NOT NULL UNIQUE,
          value TEXT NOT NULL,
          description TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_app_secrets_key ON app_secrets(key);
      `)

      return response.status(200).json({
        success: true,
        message: 'Table app_secrets créée avec succès',
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la table',
        error: error.message,
      })
    }
  }

  /**
   * POST /app-secrets/init-firebase
   * Initialiser les credentials Firebase dans la BD
   * Body: { projectId, clientEmail, privateKey }
   */
  async initFirebaseCredentials({ request, response }: HttpContext) {
    try {
      const { projectId, clientEmail, privateKey } = request.only(['projectId', 'clientEmail', 'privateKey'])

      if (!projectId || !clientEmail || !privateKey) {
        return response.status(400).json({
          success: false,
          message: 'Tous les champs sont requis: projectId, clientEmail, privateKey',
        })
      }

      const firebaseCredentials = [
        {
          key: 'FIREBASE_PROJECT_ID',
          value: projectId,
          description: 'Firebase Project ID',
        },
        {
          key: 'FIREBASE_CLIENT_EMAIL',
          value: clientEmail,
          description: 'Firebase Client Email',
        },
        {
          key: 'FIREBASE_PRIVATE_KEY',
          value: privateKey,
          description: 'Firebase Private Key',
        },
      ]

      for (const cred of firebaseCredentials) {
        await AppSecret.updateOrCreate({ key: cred.key }, cred)
      }

      return response.status(200).json({
        success: true,
        message: 'Credentials Firebase initialisés avec succès',
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Erreur lors de l\'initialisation des credentials',
        error: error.message,
      })
    }
  }

  /**
   * GET /app-secrets/:key
   * Récupérer un secret par sa clé
   */
  async getSecret({ params, response }: HttpContext) {
    try {
      const secret = await AppSecret.findBy('key', params.key)

      if (!secret) {
        return response.status(404).json({
          success: false,
          message: 'Secret non trouvé',
        })
      }

      return response.status(200).json({
        success: true,
        secret: {
          key: secret.key,
          value: secret.value,
          description: secret.description,
        },
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du secret',
        error: error.message,
      })
    }
  }

  /**
   * GET /app-secrets/add-firebase-order-id-column
   * Ajouter la colonne firebase_order_id à la table ecommerce_orders
   */
  async addFirebaseOrderIdColumn({ response }: HttpContext) {
    try {
      await db.rawQuery(`
        ALTER TABLE ecommerce_orders 
        ADD COLUMN IF NOT EXISTS firebase_order_id VARCHAR(255) NULL;
      `)

      return response.status(200).json({
        success: true,
        message: 'Colonne firebase_order_id ajoutée avec succès',
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Erreur lors de l\'ajout de la colonne',
        error: error.message,
      })
    }
  }
}
