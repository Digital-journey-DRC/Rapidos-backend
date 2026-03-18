import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'commande_express'

  async up() {
    // Migration déjà appliquée - colonnes existent déjà
    // Ne rien faire pour éviter les erreurs
  }

  async down() {
    // Ne rien faire car up() ne fait rien
  }
}
