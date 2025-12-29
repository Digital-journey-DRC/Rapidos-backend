import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import app from '@adonisjs/core/services/app'

export default class AddCodeColisColumn extends BaseCommand {
  static commandName = 'add:code-colis-column'
  static description = 'Ajouter la colonne code_colis à la table ecommerce_orders'

  static options: CommandOptions = {}

  async run() {
    const { default: db } = await import('@adonisjs/lucid/services/db')
    
    try {
      await db.rawQuery('ALTER TABLE ecommerce_orders ADD COLUMN IF NOT EXISTS code_colis VARCHAR(4) NULL')
      this.logger.success('✅ Colonne code_colis ajoutée avec succès!')
    } catch (error) {
      this.logger.error('❌ Erreur: ' + error.message)
    }
  }
}