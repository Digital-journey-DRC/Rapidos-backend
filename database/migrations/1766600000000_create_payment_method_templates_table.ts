import { BaseSchema } from '@adonisjs/lucid/schema'
import { Modepaiement } from '../../app/Enum/mode_paiement.js'

export default class extends BaseSchema {
  protected tableName = 'payment_method_templates'

  async up() {
    const exists = await this.schema.hasTable(this.tableName)
    if (exists) {
      return
    }

    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table
        .enum('type', Object.values(Modepaiement))
        .notNullable()
        .unique()
      table.string('name', 100).notNullable()
      table.string('description', 255).nullable()
      table.string('image_url', 500).notNullable()
      table.boolean('is_active').defaultTo(true).notNullable()
      table.integer('display_order').defaultTo(0).notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
  }

  async deferUp() {
    // Vérifier si des données existent déjà
    const count = await this.db.from('payment_method_templates').count('* as total')
    if (Number(count[0].total) > 0) {
      return
    }

    // Insérer les moyens de paiement prédéfinis
    const templates = [
      {
        type: Modepaiement.CASH,
        name: 'Cash',
        description: 'Paiement en espèces',
        image_url: 'https://res.cloudinary.com/deb9kfhnx/image/upload/v1766690324/rapidons/pnyywyyilm5996vdrj0h.jpg',
        is_active: true,
        display_order: 1,
      },
      {
        type: Modepaiement.MPESA,
        name: 'Mpesa',
        description: 'Paiement mobile Mpesa',
        image_url: 'https://res.cloudinary.com/deb9kfhnx/image/upload/v1766690325/rapidons/ww0djkzaf1a7xlh7pd8z.png',
        is_active: true,
        display_order: 2,
      },
      {
        type: Modepaiement.ORANGEMONEY,
        name: 'Orange Money',
        description: 'Paiement mobile Orange Money',
        image_url: 'https://res.cloudinary.com/deb9kfhnx/image/upload/v1766690323/rapidons/p2a5dall7jhxq475ahgg.png',
        is_active: true,
        display_order: 3,
      },
      {
        type: Modepaiement.AIRTELMONEY,
        name: 'Airtel Money',
        description: 'Paiement mobile Airtel Money',
        image_url: 'https://res.cloudinary.com/deb9kfhnx/image/upload/v1766690324/rapidons/tcp28yzu0mi2wfzgjxrj.png',
        is_active: true,
        display_order: 4,
      },
      {
        type: Modepaiement.AFRIMONEY,
        name: 'Afrimoney',
        description: 'Paiement mobile Afrimoney',
        image_url: 'https://res.cloudinary.com/deb9kfhnx/image/upload/v1766690323/rapidons/ayrodx5ewctpm2zeeojd.png',
        is_active: true,
        display_order: 5,
      },
      {
        type: Modepaiement.VISA,
        name: 'Visa',
        description: 'Carte bancaire Visa',
        image_url: 'https://res.cloudinary.com/deb9kfhnx/image/upload/v1766690325/rapidons/bzcqoiuzajnjmhtxmvwr.webp',
        is_active: true,
        display_order: 6,
      },
    ]

    await this.db.table('payment_method_templates').insert(templates)
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

