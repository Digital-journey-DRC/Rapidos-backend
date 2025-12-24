import db from '@adonisjs/lucid/services/db';
export default class MigrationController {
    async createPromotionsTable({ response }) {
        try {
            const migrationSQL = `
        CREATE TABLE IF NOT EXISTS promotions (
          id SERIAL PRIMARY KEY,
          product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          image VARCHAR(255) NOT NULL,
          image1 VARCHAR(255) NULL,
          image2 VARCHAR(255) NULL,
          image3 VARCHAR(255) NULL,
          image4 VARCHAR(255) NULL,
          libelle VARCHAR(255) NOT NULL,
          likes INTEGER DEFAULT 0,
          delai_promotion TIMESTAMP NOT NULL,
          nouveau_prix DECIMAL(10, 2) NOT NULL,
          ancien_prix DECIMAL(10, 2) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
            await db.rawQuery(migrationSQL);
            return response.ok({
                message: 'Table promotions créée avec succès!',
                status: 200,
            });
        }
        catch (error) {
            if (error.message?.includes('already exists') || error.code === '42P07') {
                return response.ok({
                    message: 'La table promotions existe déjà',
                    status: 200,
                });
            }
            return response.internalServerError({
                message: 'Erreur lors de la création de la table',
                error: error.message,
                status: 500,
            });
        }
    }
}
//# sourceMappingURL=migration_controller.js.map