import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'commande_express'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Moyen de paiement
      table.integer('payment_method_id').unsigned().nullable()

      // Photo du colis
      table.text('package_photo').nullable()
      table.text('package_photo_public_id').nullable()

      // Code de livraison
      table.string('code_colis', 10).nullable()

      // Frais et totaux
      table.decimal('delivery_fee', 12, 2).nullable()
      table.decimal('total_avec_livraison', 12, 2).nullable()

      // Géolocalisation
      table.decimal('latitude', 10, 8).nullable()
      table.decimal('longitude', 11, 8).nullable()

      // Firebase
      table.text('firebase_order_id').nullable()

      // Adresse structurée (JSONB)
      table.jsonb('address').nullable()

      // Numéro de paiement
      table.string('numero_payment', 50).nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('payment_method_id')
      table.dropColumn('package_photo')
      table.dropColumn('package_photo_public_id')
      table.dropColumn('code_colis')
      table.dropColumn('delivery_fee')
      table.dropColumn('total_avec_livraison')
      table.dropColumn('latitude')
      table.dropColumn('longitude')
      table.dropColumn('firebase_order_id')
      table.dropColumn('address')
      table.dropColumn('numero_payment')
    })
  }
}