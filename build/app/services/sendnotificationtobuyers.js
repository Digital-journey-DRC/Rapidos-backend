import Commande from '#models/commande';
import CommandeProduct from '#models/commande_product';
import User from '#models/user';
export const sendMessageToBuyers = async (products, commandeId) => {
    try {
        const commande = await Commande.findOrFail(commandeId);
        const acheteur = await User.findOrFail(commande.userId);
        const productsDetails = await CommandeProduct.query()
            .where('commandeId', commande.id)
            .preload('product')
            .where('productId', 'in', products.map((p) => p.id));
        const messages = [];
        for (const product of productsDetails) {
            const vendeur = await User.findOrFail(product.product.vendeurId);
            const message = `Bonjour ${vendeur.lastName} vous avez une nouvelle commande pour le produit ${product.product.name} de l'acheteur ${acheteur.lastName}. Détails de la commande :${product.quantity} unités à ${product.product.price} $ chaque.`;
            messages.push({
                message,
                numero: vendeur.phone,
            });
        }
        return messages;
    }
    catch (error) {
        console.error("Erreur lors de l'envoi des notifications aux vendeurs:", error);
        throw new Error("Erreur lors de l'envoi des notifications aux vendeurs: " + error.message);
    }
};
//# sourceMappingURL=sendnotificationtobuyers.js.map