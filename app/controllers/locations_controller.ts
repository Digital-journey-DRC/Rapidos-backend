import type { HttpContext } from '@adonisjs/core/http'

export default class LocationsController {
  // Données statiques des pays
  private pays = [
    { id: 1, code: 'CD', nom: 'RDC' },
    { id: 2, code: 'CG', nom: 'Congo-Brazzaville' },
  ]

  // Données statiques des provinces
  private provinces = [
    { id: 1, nom: 'Kinshasa', paysId: 1 },
    { id: 2, nom: 'Kongo Central', paysId: 1 },
    { id: 3, nom: 'Haut-Katanga', paysId: 1 },
    { id: 4, nom: 'Nord-Kivu', paysId: 1 },
    { id: 5, nom: 'Sud-Kivu', paysId: 1 },
    { id: 6, nom: 'Lualaba', paysId: 1 },
    { id: 7, nom: 'Kwilu', paysId: 1 },
    { id: 8, nom: 'Mai-Ndombe', paysId: 1 },
    { id: 9, nom: 'Équateur', paysId: 1 },
    { id: 10, nom: 'Tshopo', paysId: 1 },
  ]

  // Données statiques des villes
  private villes = [
    { id: 1, nom: 'Kinshasa', provinceId: 1 },
    { id: 2, nom: 'Matadi', provinceId: 2 },
    { id: 3, nom: 'Mbanza-Ngungu', provinceId: 2 },
    { id: 4, nom: 'Boma', provinceId: 2 },
    { id: 5, nom: 'Lubumbashi', provinceId: 3 },
    { id: 6, nom: 'Likasi', provinceId: 3 },
    { id: 7, nom: 'Kolwezi', provinceId: 6 },
    { id: 8, nom: 'Goma', provinceId: 4 },
    { id: 9, nom: 'Bukavu', provinceId: 5 },
    { id: 10, nom: 'Kikwit', provinceId: 7 },
    { id: 11, nom: 'Bandundu', provinceId: 7 },
    { id: 12, nom: 'Inongo', provinceId: 8 },
    { id: 13, nom: 'Mbandaka', provinceId: 9 },
    { id: 14, nom: 'Kisangani', provinceId: 10 },
  ]

  // Données statiques des communes (focus sur Kinshasa)
  private communes = [
    // Communes de Kinshasa (villeId: 1)
    { id: 1, nom: 'Gombe', villeId: 1 },
    { id: 2, nom: 'Kalamu', villeId: 1 },
    { id: 3, nom: 'Limete', villeId: 1 },
    { id: 4, nom: 'Ngaliema', villeId: 1 },
    { id: 5, nom: 'Barumbu', villeId: 1 },
    { id: 6, nom: 'Kasa-Vubu', villeId: 1 },
    { id: 7, nom: 'Lemba', villeId: 1 },
    { id: 8, nom: 'Matete', villeId: 1 },
    { id: 9, nom: 'Ngiri-Ngiri', villeId: 1 },
    { id: 10, nom: 'Kintambo', villeId: 1 },
    { id: 11, nom: 'Kinshasa', villeId: 1 },
    { id: 12, nom: 'Bandalungwa', villeId: 1 },
    { id: 13, nom: 'Bumbu', villeId: 1 },
    { id: 14, nom: 'Makala', villeId: 1 },
    { id: 15, nom: 'Ngaba', villeId: 1 },
    { id: 16, nom: 'Selembao', villeId: 1 },
    { id: 17, nom: 'Kisenso', villeId: 1 },
    { id: 18, nom: 'Mont-Ngafula', villeId: 1 },
    { id: 19, nom: 'Ngaliema', villeId: 1 },
    { id: 20, nom: 'Masina', villeId: 1 },
    { id: 21, nom: 'Ndjili', villeId: 1 },
    { id: 22, nom: 'Kimbanseke', villeId: 1 },
    { id: 23, nom: 'Nsele', villeId: 1 },
    { id: 24, nom: 'Maluku', villeId: 1 },
    // Communes de Lubumbashi (villeId: 5)
    { id: 25, nom: 'Lubumbashi', villeId: 5 },
    { id: 26, nom: 'Kampemba', villeId: 5 },
    { id: 27, nom: 'Katuba', villeId: 5 },
    { id: 28, nom: 'Kamalondo', villeId: 5 },
    { id: 29, nom: 'Kenya', villeId: 5 },
    { id: 30, nom: 'Ruashi', villeId: 5 },
    { id: 31, nom: 'Annexe', villeId: 5 },
    // Communes de Goma (villeId: 8)
    { id: 32, nom: 'Goma', villeId: 8 },
    { id: 33, nom: 'Karisimbi', villeId: 8 },
    { id: 34, nom: 'Mugunga', villeId: 8 },
    // Communes de Matadi (villeId: 2)
    { id: 35, nom: 'Matadi', villeId: 2 },
    { id: 36, nom: 'Nzanza', villeId: 2 },
    { id: 37, nom: 'Mvuzi', villeId: 2 },
  ]

  /**
   * GET /locations/pays
   * Récupérer la liste de tous les pays
   */
  async getPays({ response }: HttpContext) {
    try {
      return response.status(200).json({
        success: true,
        data: this.pays,
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des pays',
        error: error.message,
      })
    }
  }

  /**
   * GET /locations/provinces?paysId=1
   * Récupérer les provinces d'un pays spécifique
   */
  async getProvinces({ request, response }: HttpContext) {
    try {
      const paysId = request.input('paysId')

      if (!paysId) {
        return response.status(200).json({
          success: true,
          data: this.provinces,
        })
      }

      const provincesFiltered = this.provinces.filter(
        (province) => province.paysId === Number(paysId)
      )

      return response.status(200).json({
        success: true,
        data: provincesFiltered,
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des provinces',
        error: error.message,
      })
    }
  }

  /**
   * GET /locations/villes?provinceId=1
   * Récupérer les villes d'une province spécifique
   */
  async getVilles({ request, response }: HttpContext) {
    try {
      const provinceId = request.input('provinceId')

      if (!provinceId) {
        return response.status(200).json({
          success: true,
          data: this.villes,
        })
      }

      const villesFiltered = this.villes.filter(
        (ville) => ville.provinceId === Number(provinceId)
      )

      return response.status(200).json({
        success: true,
        data: villesFiltered,
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des villes',
        error: error.message,
      })
    }
  }

  /**
   * GET /locations/communes?villeId=1
   * Récupérer les communes d'une ville spécifique
   */
  async getCommunes({ request, response }: HttpContext) {
    try {
      const villeId = request.input('villeId')

      if (!villeId) {
        return response.status(200).json({
          success: true,
          data: this.communes,
        })
      }

      const communesFiltered = this.communes.filter(
        (commune) => commune.villeId === Number(villeId)
      )

      return response.status(200).json({
        success: true,
        data: communesFiltered,
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des communes',
        error: error.message,
      })
    }
  }
}
