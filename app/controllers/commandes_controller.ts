import Adresse from '#models/adresse'
import CommandeProduct from '#models/commande_product'
import Product from '#models/product'
import type { HttpContext } from '@adonisjs/core/http'

export default class CommandesController {
  async createCommande({ params, request, response, auth, bouncer }: HttpContext) {
    try {
      if (await bouncer.denies('canCommandeProduct')) {
        return response.forbidden({ message: "Vous n'avez pas accès à cette fonctionnalité" })
      }
      const user = auth.user!
      const produits = request.only(['produits'])
      const { quandity, ville, avenue, codePostale, isPrincipal, type, numero } = request.body()

      if (!produits || produits.length === 0) {
        return response.badRequest({ message: 'Veuillez fournir au moins un produit' })
      }

      for (const productId of produits) {
        const product = await Product.findByOrFail(productId)
        const commandeProducts = await CommandeProduct.create()
      }
      const isAdresseExist = await Adresse.query()
        .where('user_id', user.id)
        .where('avenue', avenue)
        .where('ville', ville)
        .where('numero', numero)
        .first()

      if (isAdresseExist) {
        return response.badRequest({ message: 'Cette adresse existe déjà' })
      }
      const adresse = await Adresse.create({
        avenue,
        ville,
        codePostal: codePostale,
        isPrincipal,
        type,
        numero,
        userId: user.id,
      })
    } catch (error) {}
  }
}
