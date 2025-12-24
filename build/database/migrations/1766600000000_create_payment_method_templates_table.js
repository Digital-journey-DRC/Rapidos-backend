import { BaseSchema } from '@adonisjs/lucid/schema';
import { Modepaiement } from '../../app/Enum/mode_paiement.js';
export default class extends BaseSchema {
    tableName = 'payment_method_templates';
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id').primary();
            table
                .enum('type', Object.values(Modepaiement))
                .notNullable()
                .unique();
            table.string('name', 100).notNullable();
            table.string('description', 255).nullable();
            table.string('image_url', 500).notNullable();
            table.boolean('is_active').defaultTo(true).notNullable();
            table.integer('display_order').defaultTo(0).notNullable();
            table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now());
            table.timestamp('updated_at', { useTz: true }).nullable();
        });
        const templates = [
            {
                type: Modepaiement.CASH,
                name: 'Cash',
                description: 'Paiement en espèces',
                image_url: 'https://res.cloudinary.com/dnn2ght5x/image/upload/v1735000000/payment_methods/cash.png',
                is_active: true,
                display_order: 1,
            },
            {
                type: Modepaiement.MPESA,
                name: 'Mpesa',
                description: 'Paiement mobile Mpesa',
                image_url: 'https://res.cloudinary.com/dnn2ght5x/image/upload/v1735000000/payment_methods/mpesa.png',
                is_active: true,
                display_order: 2,
            },
            {
                type: Modepaiement.ORANGEMONEY,
                name: 'Orange Money',
                description: 'Paiement mobile Orange Money',
                image_url: 'https://res.cloudinary.com/dnn2ght5x/image/upload/v1735000000/payment_methods/orange_money.png',
                is_active: true,
                display_order: 3,
            },
            {
                type: Modepaiement.AIRTELMONEY,
                name: 'Airtel Money',
                description: 'Paiement mobile Airtel Money',
                image_url: 'https://res.cloudinary.com/dnn2ght5x/image/upload/v1735000000/payment_methods/airtel_money.png',
                is_active: true,
                display_order: 4,
            },
            {
                type: Modepaiement.AFRIMONEY,
                name: 'Afrimoney',
                description: 'Paiement mobile Afrimoney',
                image_url: 'https://res.cloudinary.com/dnn2ght5x/image/upload/v1735000000/payment_methods/afrimoney.png',
                is_active: true,
                display_order: 5,
            },
            {
                type: Modepaiement.VISA,
                name: 'Visa',
                description: 'Carte bancaire Visa',
                image_url: 'https://res.cloudinary.com/dnn2ght5x/image/upload/v1735000000/payment_methods/visa.png',
                is_active: true,
                display_order: 6,
            },
        ];
        await this.db.table('payment_method_templates').insert(templates);
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
//# sourceMappingURL=1766600000000_create_payment_method_templates_table.js.map