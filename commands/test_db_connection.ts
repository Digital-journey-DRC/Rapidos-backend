import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import db from '@adonisjs/lucid/services/db'
import env from '#start/env'

export default class TestDbConnection extends BaseCommand {
  static commandName = 'test:db'
  static description = 'Tester la connexion à la base de données'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    try {
      this.logger.info('🔄 Test de connexion à la base de données...\n')
      
      // Test simple de la connexion
      const result = await db.rawQuery('SELECT NOW() as current_time, version() as postgres_version')
      
      this.logger.success('✅ Connexion réussie !\n')
      this.logger.info('📊 Informations de connexion:')
      console.log(`   - Heure serveur: ${result.rows[0].current_time}`)
      console.log(`   - Version PostgreSQL: ${result.rows[0].postgres_version.split(',')[0]}\n`)
      
      // Test de la configuration
      this.logger.info('🔧 Configuration de la connexion:')
      console.log(`   - Host: ${env.get('DB_HOST')}`)
      console.log(`   - Port: ${env.get('DB_PORT')}`)
      console.log(`   - Database: ${env.get('DB_DATABASE')}`)
      console.log(`   - User: ${env.get('DB_USER')}`)
      console.log(`   - SSL: Activé (rejectUnauthorized: false)\n`)
      
      // Test supplémentaire : compter les tables
      const tablesResult = await db.rawQuery(`
        SELECT COUNT(*) as table_count 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `)
      this.logger.info(`📋 Nombre de tables: ${tablesResult.rows[0].table_count}`)
      
      this.logger.success('\n🎉 Test de connexion terminé avec succès!')
      
    } catch (error: any) {
      this.logger.error('❌ Erreur de connexion:\n')
      console.error(`   ${error.message}\n`)
      
      if (error.code) {
        console.error(`   Code d'erreur: ${error.code}`)
      }
      
      if (error.address) {
        console.error(`   Adresse: ${error.address}`)
      }
      
      throw error
    }
  }
}

