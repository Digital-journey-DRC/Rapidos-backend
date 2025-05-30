import Commande from '#models/commande'
import Product from '#models/product'
import type { HttpContext } from '@adonisjs/core/http'

export default class LivraisonsController {
  async showAllDelivery({ response, auth, bouncer }: HttpContext) {
    try {
      const products = await Product.query()
      const commandes = await Commande.query()
      if (await bouncer.denies('canShowAllDelivery', commandes, products)) {
        return response.forbidden({ message: "Vous n'avez pas accès à cette fonctionnalité" })
      }
    } catch (error) {}
  }
}
