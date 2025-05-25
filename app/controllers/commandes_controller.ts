import type { HttpContext } from '@adonisjs/core/http'

export default class CommandesController {
  async createCommande({ params, request, response, auth, bouncer }: HttpContext) {
    try {
      if (await bouncer.denies('canCommandeProduct')) {
        return response.forbidden({ message: "Vous n'avez pas accès à cette fonctionnalité" })
      }
      const user = auth.user!
      const { productId } = params
      const { quandity, ville, avenue, codePostale, isPrincipal, type } = request.body()
    } catch (error) {}
  }
}
