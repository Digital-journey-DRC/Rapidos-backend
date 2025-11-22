import HoraireOuverture from '#models/horaire_ouverture';
import User from '#models/user';
import { UserRole } from '../Enum/user_role.js';
import { createHoraireOuvertureValidator, updateHoraireOuvertureValidator } from '#validators/horaire_ouverture';
export default class HorairesOuvertureController {
    async store({ request, response, auth }) {
        try {
            const user = auth.user;
            if (user.role !== UserRole.Vendeur) {
                return response.status(403).json({
                    message: 'Seuls les vendeurs peuvent enregistrer des horaires d\'ouverture',
                });
            }
            const payload = await request.validateUsing(createHoraireOuvertureValidator);
            if (payload.estOuvert && payload.heureOuverture && payload.heureFermeture) {
                if (payload.heureOuverture >= payload.heureFermeture) {
                    return response.status(422).json({
                        message: 'L\'heure d\'ouverture doit être antérieure à l\'heure de fermeture',
                    });
                }
            }
            const horaire = await HoraireOuverture.updateOrCreate({
                vendeurId: user.id,
                jour: payload.jour,
            }, {
                heureOuverture: payload.heureOuverture || null,
                heureFermeture: payload.heureFermeture || null,
                estOuvert: payload.estOuvert ?? false,
            });
            return response.status(201).json({
                message: 'Horaire d\'ouverture enregistré avec succès',
                horaire,
            });
        }
        catch (error) {
            if (error.code === 'E_VALIDATION_FAILURE') {
                return response.status(422).json({
                    message: 'Données invalides',
                    errors: error.messages,
                });
            }
            return response.status(500).json({
                message: 'Erreur serveur interne',
                error: error.message,
            });
        }
    }
    async index({ response, auth }) {
        try {
            const user = auth.user;
            if (user.role !== UserRole.Vendeur) {
                return response.status(403).json({
                    message: 'Seuls les vendeurs peuvent consulter leurs horaires d\'ouverture',
                });
            }
            const horaires = await HoraireOuverture.query().where('vendeurId', user.id);
            return response.status(200).json({
                message: 'Horaires d\'ouverture récupérés avec succès',
                horaires,
            });
        }
        catch (error) {
            return response.status(500).json({
                message: 'Erreur serveur interne',
                error: error.message,
            });
        }
    }
    async show({ params, response, auth }) {
        try {
            const user = auth.user;
            const { jour } = params;
            if (user.role !== UserRole.Vendeur) {
                return response.status(403).json({
                    message: 'Seuls les vendeurs peuvent consulter leurs horaires d\'ouverture',
                });
            }
            const horaire = await HoraireOuverture.query()
                .where('vendeurId', user.id)
                .where('jour', jour)
                .first();
            if (!horaire) {
                return response.status(404).json({
                    message: 'Horaire d\'ouverture non trouvé pour ce jour',
                });
            }
            return response.status(200).json({
                message: 'Horaire d\'ouverture récupéré avec succès',
                horaire,
            });
        }
        catch (error) {
            return response.status(500).json({
                message: 'Erreur serveur interne',
                error: error.message,
            });
        }
    }
    async update({ params, request, response, auth }) {
        try {
            const user = auth.user;
            const { jour } = params;
            if (user.role !== UserRole.Vendeur) {
                return response.status(403).json({
                    message: 'Seuls les vendeurs peuvent modifier leurs horaires d\'ouverture',
                });
            }
            const payload = await request.validateUsing(updateHoraireOuvertureValidator);
            const horaire = await HoraireOuverture.query()
                .where('vendeurId', user.id)
                .where('jour', jour)
                .firstOrFail();
            const heureOuverture = payload.heureOuverture ?? horaire.heureOuverture;
            const heureFermeture = payload.heureFermeture ?? horaire.heureFermeture;
            const estOuvert = payload.estOuvert ?? horaire.estOuvert;
            if (estOuvert && heureOuverture && heureFermeture) {
                if (heureOuverture >= heureFermeture) {
                    return response.status(422).json({
                        message: 'L\'heure d\'ouverture doit être antérieure à l\'heure de fermeture',
                    });
                }
            }
            horaire.merge(payload);
            await horaire.save();
            return response.status(200).json({
                message: 'Horaire d\'ouverture mis à jour avec succès',
                horaire,
            });
        }
        catch (error) {
            if (error.code === 'E_ROW_NOT_FOUND') {
                return response.status(404).json({
                    message: 'Horaire d\'ouverture non trouvé',
                });
            }
            if (error.code === 'E_VALIDATION_FAILURE') {
                return response.status(422).json({
                    message: 'Données invalides',
                    errors: error.messages,
                });
            }
            return response.status(500).json({
                message: 'Erreur serveur interne',
                error: error.message,
            });
        }
    }
    async destroy({ params, response, auth }) {
        try {
            const user = auth.user;
            const { jour } = params;
            if (user.role !== UserRole.Vendeur) {
                return response.status(403).json({
                    message: 'Seuls les vendeurs peuvent supprimer leurs horaires d\'ouverture',
                });
            }
            const horaire = await HoraireOuverture.query()
                .where('vendeurId', user.id)
                .where('jour', jour)
                .firstOrFail();
            await horaire.delete();
            return response.status(200).json({
                message: 'Horaire d\'ouverture supprimé avec succès',
                status: true,
            });
        }
        catch (error) {
            if (error.code === 'E_ROW_NOT_FOUND') {
                return response.status(404).json({
                    message: 'Horaire d\'ouverture non trouvé',
                });
            }
            return response.status(500).json({
                message: 'Erreur serveur interne',
                error: error.message,
            });
        }
    }
    async createTable({ response }) {
        try {
            const db = await import('@adonisjs/lucid/services/db');
            await db.default.raw(`
        CREATE TABLE IF NOT EXISTS horaires_ouverture (
          id SERIAL PRIMARY KEY,
          vendeur_id INTEGER NOT NULL,
          jour VARCHAR(255) NOT NULL,
          heure_ouverture TIME,
          heure_fermeture TIME,
          est_ouvert BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          CONSTRAINT unique_vendeur_jour UNIQUE (vendeur_id, jour),
          CONSTRAINT fk_vendeur FOREIGN KEY (vendeur_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
            return response.status(200).json({
                message: 'Table horaires_ouverture créée avec succès',
                status: true,
            });
        }
        catch (error) {
            return response.status(500).json({
                message: 'Erreur lors de la création de la table',
                error: error.message,
            });
        }
    }
}

