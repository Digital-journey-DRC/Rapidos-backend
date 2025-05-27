import Adresse from '#models/adresse';
import Commande from '#models/commande';
import CommandeProduct from '#models/commande_product';
import Product from '#models/product';
import { adresseValidator } from '#validators/adress';
import { StatusCommande } from '../Enum/status_commande.js';
import { sendMessageToBuyers } from '#services/sendnotificationtobuyers';
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
            return response.created({
                message: 'Commande enregistrée avec succès',
                commande: commande,
                total: commande.totalPrice,
                adresse: adresse,
                notification: messageTobuyers,
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
}
//# sourceMappingURL=commandes_controller.js.map