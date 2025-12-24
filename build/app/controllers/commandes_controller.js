import Adresse from '#models/adresse';
import Commande from '#models/commande';
import CommandeProduct from '#models/commande_product';
import Product from '#models/product';
import { adresseValidator } from '#validators/adress';
import { StatusCommande } from '../Enum/status_commande.js';
import { sendMessageToBuyers } from '#services/sendnotificationtobuyers';
import Livraison from '#models/livraison';
export default class CommandesController {
    async createCommande({ request, response, auth, bouncer }) {
        try {
            if (await bouncer.denies('canCommandeProduct')) {
                return response.forbidden({ message: "Vous n'avez pas accès à cette fonctionnalité" });
            }
            const user = auth.user;
            const { produits } = request.only(['produits']);
            const adressePayload = await request.validateUsing(adresseValidator);
            if (!produits || !Array.isArray(produits) || produits.length === 0) {
                return response.badRequest({ message: 'Le panier est vide.' });
            }
            for (const item of produits) {
                const product = await Product.find(item.id);
                if (!product) {
                    return response.badRequest({ message: `Produit ${item.id} introuvable` });
                }
                if (product.stock < (item.quantity ?? 1)) {
                    return response.badRequest({
                        message: `Le produit ${product.name} n'a pas assez de stock disponible.`,
                    });
                }
            }
            const commande = await Commande.create({
                userId: user.id,
                totalPrice: 0,
                status: StatusCommande.EN_ATTENTE,
            });
            let totalPrice = 0;
            let productInCommande = [];
            let messageTobuyers = [];
            for (const item of produits) {
                const product = await Product.find(item.id);
                if (!product) {
                    continue;
                }
                const quantity = item.quantity ?? 1;
                const price = product.price;
                const totalUnitaire = price * quantity;
                productInCommande.push(product);
                await CommandeProduct.create({
                    commandeId: commande.id,
                    productId: product.id,
                    quantity,
                    price,
                    totalUnitaire,
                });
                product.stock -= quantity;
                await product.save();
                totalPrice += totalUnitaire;
            }
            messageTobuyers = await sendMessageToBuyers(productInCommande, commande.id);
            commande.totalPrice = totalPrice;
            await commande.save();
            const adresseExistante = await Adresse.query()
                .where('user_id', user.id)
                .where('ville', adressePayload.ville)
                .where('avenue', adressePayload.avenue)
                .where('numero', adressePayload.numero)
                .first();
            const adresse = adresseExistante
                ? adresseExistante
                : await Adresse.create({
                    ...adressePayload,
                    userId: user.id,
                });
            const livraison = await Livraison.create({
                commandeId: commande.id,
                adresseId: adresse.id,
                status: StatusCommande.EN_ATTENTE,
            });
            const deliveryDetails = await Livraison.query()
                .preload('adresse')
                .where('id', livraison.id)
                .first();
            return response.created({
                message: 'Commande enregistrée avec succès',
                commande: commande,
                total: commande.totalPrice,
                adresse: adresse,
                notification: messageTobuyers,
                livraison: deliveryDetails,
            });
        }
        catch (error) {
            console.error(error);
            return response.internalServerError({
                message: 'Erreur lors de la création de la commande',
                error: error.message,
            });
        }
    }
    async getCommandesByUser({ auth, response }) {
        try {
            const products = await Product.query().where('vendeurId', auth.user.id);
            if (products.length === 0) {
                return response.ok({
                    message: 'Aucun produit trouvé pour cet utilisateur',
                    products: [],
                });
            }
            const commandes = await CommandeProduct.query()
                .whereIn('productId', products.map((p) => p.id))
                .preload('product')
                .preload('commande', (query) => {
                query.preload('user');
            })
                .orderBy('created_at', 'desc');
            const factureByCommande = await Commande.query().whereIn('id', commandes.map((c) => c.commandeId));
            return response.ok({
                message: 'Commandes récupérées avec succès',
                commandes: commandes,
                facture: factureByCommande,
                products: products,
            });
        }
        catch (error) {
            console.error(error);
            return response.internalServerError({
                message: 'Erreur lors de la récupération des commandes',
                error: error.message,
            });
        }
    }
    async getCommandeByAcheteur({ response, auth }) {
        try {
            const commandes = await CommandeProduct.query().preload('commande', (query) => {
                query.where('userId', auth.user.id);
            });
            return response.ok({
                message: 'Commandes récupérées avec succès',
                commandes: commandes,
            });
        }
        catch (error) {
            console.error(error);
            return response.internalServerError({
                message: 'Erreur lors de la récupération des commandes',
                error: error.message,
            });
        }
    }
}
//# sourceMappingURL=commandes_controller.js.map