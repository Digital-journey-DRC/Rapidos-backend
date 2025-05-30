import Commande from '#models/commande'
import Livraison from '#models/livraison'
import Product from '#models/product'

import type { HttpContext } from '@adonisjs/core/http'

export default class LivraisonsController {
  async showAllDelivery({ response, bouncer }: HttpContext) {
    try {
      const products = await Product.query()
      const commandes = await Commande.query()
      if (await bouncer.denies('canShowAllDelivery', commandes, products)) {
        return response.forbidden({ message: "Vous n'avez pas accès à cette fonctionnalité" })
      }

      //récupération de toutes les livraisons avec adresses et numéro de téléphone de l'acheteur sachant que l'id de l'acheteur est dans la commande
      const deliverys = await Livraison.query()
        .preload('adresse') // relation directe
        .preload('commande', (commandeQuery) => {
          commandeQuery.preload('user', (userQuery) => {
            userQuery.select(['id', 'firstName', 'lastName', 'phone'])
          })
        })
      return response.ok({
        livraison: deliverys,
      })
    } catch (error) {
      if (error.code === 'E_UNAUTHORIZED_ACCESS') {
        return response.forbidden({
          message: "Vous n'avez pas accès à cette fonctionnalité",
          status: 403,
        })
      }
      return response.internalServerError({
        message: 'Une erreur est survenue lors de la récupération des livraisons',
        status: 500,
      })
    }
  }
}
