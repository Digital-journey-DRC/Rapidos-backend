import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'ecommerce_orders'

  async up() {
    // Table déjà créée - ne rien faire
  }

  async down() {
    // Ne rien faire
  }
}