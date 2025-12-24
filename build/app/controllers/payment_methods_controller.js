import PaymentMethod from '#models/payment_method';
import PaymentMethodTemplate from '#models/payment_method_template';
import { createPaymentMethodValidator, updatePaymentMethodValidator, activateTemplateValidator, } from '#validators/payment_method';
import { UserRole } from '../Enum/user_role.js';
export default class PaymentMethodsController {
    async createTable({ response }) {
        try {
            const dbService = await import('@adonisjs/lucid/services/db');
            await dbService.default.raw('DROP TABLE IF EXISTS payment_methods CASCADE');
            await dbService.default.raw(`
        CREATE TABLE payment_methods (
          id SERIAL PRIMARY KEY,
          vendeur_id INTEGER NOT NULL,
          type VARCHAR(50) NOT NULL DEFAULT 'orange_money' CHECK (type IN ('cash', 'mpesa', 'orange_money', 'airtel_money', 'afrimoney', 'visa', 'master_card')),
          numero_compte VARCHAR(50) NOT NULL,
          nom_titulaire VARCHAR(100),
          is_default BOOLEAN NOT NULL DEFAULT false,
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE,
          CONSTRAINT fk_vendeur FOREIGN KEY (vendeur_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
            await dbService.default.raw('CREATE INDEX idx_payment_methods_vendeur ON payment_methods(vendeur_id)');
            return response.created({
                message: 'Table payment_methods créée avec succès',
            });
        }
        catch (error) {
            console.error(error);
            return response.internalServerError({
                message: 'Erreur lors de la création de la table',
                error: error.message,
            });
        }
    }
    async store({ request, response, auth }) {
        try {
            const user = auth.user;
            if (user.role !== UserRole.Vendeur) {
                return response.forbidden({
                    message: 'Seuls les vendeurs peuvent ajouter des moyens de paiement',
                });
            }
            const payload = await request.validateUsing(createPaymentMethodValidator);
            if (payload.isDefault) {
                await PaymentMethod.query()
                    .where('vendeur_id', user.id)
                    .where('is_default', true)
                    .update({ isDefault: false });
            }
            const paymentMethod = await PaymentMethod.create({
                vendeurId: user.id,
                type: payload.type,
                numeroCompte: payload.numeroCompte,
                nomTitulaire: payload.nomTitulaire || null,
                isDefault: payload.isDefault || false,
                isActive: true,
            });
            return response.created({
                message: 'Moyen de paiement ajouté avec succès',
                paymentMethod: paymentMethod,
            });
        }
        catch (error) {
            console.error(error);
            return response.internalServerError({
                message: 'Erreur lors de la création du moyen de paiement',
                error: error.message,
            });
        }
    }
    async getByVendeurId({ params, response, auth }) {
        try {
            auth.user;
            const { vendeurId } = params;
            if (!vendeurId) {
                return response.badRequest({
                    message: 'ID du vendeur requis',
                });
            }
            const { default: User } = await import('#models/user');
            const vendeur = await User.find(vendeurId);
            if (!vendeur) {
                return response.notFound({
                    message: 'Vendeur non trouvé',
                });
            }
            if (vendeur.role !== UserRole.Vendeur) {
                return response.badRequest({
                    message: "L'utilisateur spécifié n'est pas un vendeur",
                });
            }
            const paymentMethods = await PaymentMethod.query()
                .where('vendeur_id', vendeurId)
                .where('is_active', true)
                .orderBy('is_default', 'desc')
                .orderBy('created_at', 'desc');
            return response.ok({
                message: 'Moyens de paiement du vendeur récupérés avec succès',
                vendeur: {
                    id: vendeur.id,
                    firstName: vendeur.firstName,
                    lastName: vendeur.lastName,
                },
                paymentMethods: paymentMethods,
            });
        }
        catch (error) {
            console.error(error);
            return response.internalServerError({
                message: 'Erreur lors de la récupération des moyens de paiement du vendeur',
                error: error.message,
            });
        }
    }
    async index({ response, auth }) {
        try {
            const user = auth.user;
            if (user.role !== UserRole.Vendeur) {
                return response.forbidden({
                    message: 'Seuls les vendeurs peuvent consulter leurs moyens de paiement',
                });
            }
            const paymentMethods = await PaymentMethod.query()
                .where('vendeur_id', user.id)
                .orderBy('is_active', 'desc')
                .orderBy('is_default', 'desc')
                .orderBy('created_at', 'desc');
            return response.ok({
                message: 'Moyens de paiement récupérés avec succès',
                paymentMethods: paymentMethods,
            });
        }
        catch (error) {
            console.error(error);
            return response.internalServerError({
                message: 'Erreur lors de la récupération des moyens de paiement',
                error: error.message,
            });
        }
    }
    async update({ params, request, response, auth }) {
        try {
            const user = auth.user;
            const { id } = params;
            if (user.role !== UserRole.Vendeur) {
                return response.forbidden({
                    message: 'Seuls les vendeurs peuvent modifier leurs moyens de paiement',
                });
            }
            const paymentMethod = await PaymentMethod.find(id);
            if (!paymentMethod) {
                return response.notFound({
                    message: 'Moyen de paiement non trouvé',
                });
            }
            if (paymentMethod.vendeurId !== user.id) {
                return response.forbidden({
                    message: "Vous n'avez pas le droit de modifier ce moyen de paiement",
                });
            }
            const payload = await request.validateUsing(updatePaymentMethodValidator);
            if (payload.isDefault === true) {
                await PaymentMethod.query()
                    .where('vendeur_id', user.id)
                    .where('is_default', true)
                    .where('id', '!=', id)
                    .update({ isDefault: false });
            }
            if (payload.type !== undefined) {
                paymentMethod.type = payload.type;
            }
            if (payload.numeroCompte !== undefined) {
                paymentMethod.numeroCompte = payload.numeroCompte;
            }
            if (payload.nomTitulaire !== undefined) {
                paymentMethod.nomTitulaire = payload.nomTitulaire;
            }
            if (payload.isDefault !== undefined) {
                paymentMethod.isDefault = payload.isDefault;
            }
            if (payload.isActive !== undefined) {
                paymentMethod.isActive = payload.isActive;
            }
            await paymentMethod.save();
            return response.ok({
                message: 'Moyen de paiement mis à jour avec succès',
                paymentMethod: paymentMethod,
            });
        }
        catch (error) {
            console.error(error);
            return response.internalServerError({
                message: 'Erreur lors de la mise à jour du moyen de paiement',
                error: error.message,
            });
        }
    }
    async destroy({ params, response, auth }) {
        try {
            const user = auth.user;
            const { id } = params;
            if (user.role !== UserRole.Vendeur) {
                return response.forbidden({
                    message: 'Seuls les vendeurs peuvent supprimer leurs moyens de paiement',
                });
            }
            const paymentMethod = await PaymentMethod.find(id);
            if (!paymentMethod) {
                return response.notFound({
                    message: 'Moyen de paiement non trouvé',
                });
            }
            if (paymentMethod.vendeurId !== user.id) {
                return response.forbidden({
                    message: "Vous n'avez pas le droit de supprimer ce moyen de paiement",
                });
            }
            await paymentMethod.delete();
            return response.ok({
                message: 'Moyen de paiement supprimé avec succès',
            });
        }
        catch (error) {
            console.error(error);
            return response.internalServerError({
                message: 'Erreur lors de la suppression du moyen de paiement',
                error: error.message,
            });
        }
    }
    async activate({ params, response, auth }) {
        try {
            const user = auth.user;
            const { id } = params;
            if (user.role !== UserRole.Vendeur) {
                return response.forbidden({
                    message: 'Seuls les vendeurs peuvent activer leurs moyens de paiement',
                });
            }
            const paymentMethod = await PaymentMethod.find(id);
            if (!paymentMethod) {
                return response.notFound({
                    message: 'Moyen de paiement non trouvé',
                });
            }
            if (paymentMethod.vendeurId !== user.id) {
                return response.forbidden({
                    message: "Vous n'avez pas le droit d'activer ce moyen de paiement",
                });
            }
            paymentMethod.isActive = true;
            await paymentMethod.save();
            return response.ok({
                message: 'Moyen de paiement activé avec succès',
                paymentMethod: paymentMethod,
            });
        }
        catch (error) {
            console.error(error);
            return response.internalServerError({
                message: 'Erreur lors de l\'activation du moyen de paiement',
                error: error.message,
            });
        }
    }
    async deactivate({ params, response, auth }) {
        try {
            const user = auth.user;
            const { id } = params;
            if (user.role !== UserRole.Vendeur) {
                return response.forbidden({
                    message: 'Seuls les vendeurs peuvent désactiver leurs moyens de paiement',
                });
            }
            const paymentMethod = await PaymentMethod.find(id);
            if (!paymentMethod) {
                return response.notFound({
                    message: 'Moyen de paiement non trouvé',
                });
            }
            if (paymentMethod.vendeurId !== user.id) {
                return response.forbidden({
                    message: "Vous n'avez pas le droit de désactiver ce moyen de paiement",
                });
            }
            if (paymentMethod.isDefault) {
                return response.badRequest({
                    message: 'Impossible de désactiver le moyen de paiement par défaut. Veuillez d\'abord définir un autre moyen de paiement par défaut.',
                });
            }
            paymentMethod.isActive = false;
            await paymentMethod.save();
            return response.ok({
                message: 'Moyen de paiement désactivé avec succès',
                paymentMethod: paymentMethod,
            });
        }
        catch (error) {
            console.error(error);
            return response.internalServerError({
                message: 'Erreur lors de la désactivation du moyen de paiement',
                error: error.message,
            });
        }
    }
    async getTemplates({ response }) {
        try {
            const templates = await PaymentMethodTemplate.query()
                .where('is_active', true)
                .orderBy('display_order', 'asc');
            return response.ok({
                message: 'Moyens de paiement disponibles récupérés avec succès',
                paymentMethods: templates,
            });
        }
        catch (error) {
            console.error(error);
            return response.internalServerError({
                message: 'Erreur lors de la récupération des moyens de paiement disponibles',
                error: error.message,
            });
        }
    }
    async activateTemplate({ request, response, auth }) {
        try {
            const user = auth.user;
            if (user.role !== UserRole.Vendeur) {
                return response.forbidden({
                    message: 'Seuls les vendeurs peuvent activer des moyens de paiement',
                });
            }
            const payload = await request.validateUsing(activateTemplateValidator);
            const template = await PaymentMethodTemplate.find(payload.templateId);
            if (!template) {
                return response.notFound({
                    message: 'Template de moyen de paiement non trouvé',
                });
            }
            if (!template.isActive) {
                return response.badRequest({
                    message: 'Ce moyen de paiement n\'est pas disponible',
                });
            }
            const existingPaymentMethod = await PaymentMethod.query()
                .where('vendeur_id', user.id)
                .where('type', template.type)
                .first();
            if (existingPaymentMethod) {
                existingPaymentMethod.numeroCompte = payload.numeroCompte.trim();
                existingPaymentMethod.nomTitulaire = payload.nomTitulaire?.trim() || null;
                existingPaymentMethod.isActive = true;
                if (payload.isDefault) {
                    await PaymentMethod.query()
                        .where('vendeur_id', user.id)
                        .where('is_default', true)
                        .where('id', '!=', existingPaymentMethod.id)
                        .update({ isDefault: false });
                    existingPaymentMethod.isDefault = true;
                }
                await existingPaymentMethod.save();
                return response.ok({
                    message: 'Moyen de paiement mis à jour avec succès',
                    paymentMethod: existingPaymentMethod,
                    template: {
                        id: template.id,
                        type: template.type,
                        name: template.name,
                        imageUrl: template.imageUrl,
                    },
                });
            }
            if (payload.isDefault) {
                await PaymentMethod.query()
                    .where('vendeur_id', user.id)
                    .where('is_default', true)
                    .update({ isDefault: false });
            }
            const paymentMethod = await PaymentMethod.create({
                vendeurId: user.id,
                type: template.type,
                numeroCompte: payload.numeroCompte.trim(),
                nomTitulaire: payload.nomTitulaire?.trim() || null,
                isDefault: payload.isDefault || false,
                isActive: true,
            });
            return response.created({
                message: 'Moyen de paiement activé avec succès',
                paymentMethod: paymentMethod,
                template: {
                    id: template.id,
                    type: template.type,
                    name: template.name,
                    imageUrl: template.imageUrl,
                },
            });
        }
        catch (error) {
            console.error(error);
            return response.internalServerError({
                message: 'Erreur lors de l\'activation du moyen de paiement',
                error: error.message,
            });
        }
    }
}
//# sourceMappingURL=payment_methods_controller.js.map