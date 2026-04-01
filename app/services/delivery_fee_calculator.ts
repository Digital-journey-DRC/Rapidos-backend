import DeliveryFeeSettings from '#models/delivery_fee_settings'
import CommuneDeliveryFee from '#models/commune_delivery_fee'
import { DistanceCalculator, GPSCoordinates } from './distance_calculator.js'

interface CalculateParams {
  commune?: string
  clientCoords: GPSCoordinates
  vendorCoords: GPSCoordinates
}

export class DeliveryFeeCalculator {
  /**
   * Calcule les frais de livraison selon la configuration globale
   */
  static async calculate(params: CalculateParams): Promise<number> {
    // Récupérer la configuration globale
    const settings = await DeliveryFeeSettings.first()

    // Si pas de config, utiliser distance par défaut (fallback)
    if (!settings) {
      const distance = DistanceCalculator.calculateDistance(
        params.clientCoords,
        params.vendorCoords
      )
      return DistanceCalculator.calculateDeliveryFee(distance)
    }

    // Calculer selon le type actif
    switch (settings.activeType) {
      case 'flat':
        return Number(settings.flatFee) || 0

      case 'distance':
        const distance = DistanceCalculator.calculateDistance(
          params.clientCoords,
          params.vendorCoords
        )
        const baseFee = Number(settings.distanceBaseFee) || 1000
        const perKmFee = Number(settings.distancePerKmFee) || 1000
        return baseFee + Math.round(distance * perKmFee)

      case 'commune':
        // Si pas de commune fournie, utiliser prix par défaut
        if (!params.commune || params.commune.trim() === '') {
          return Number(settings.communeDefaultFee)
        }

        // Chercher la commune dans la config (insensible à la casse)
        const communeConfig = await CommuneDeliveryFee.query()
          .where('commune_name', 'ILIKE', params.commune.trim())
          .where('is_active', true)
          .first()

        // Si commune trouvée, utiliser son prix, sinon prix par défaut
        return communeConfig ? Number(communeConfig.fee) : Number(settings.communeDefaultFee)

      default:
        // Fallback sur distance si type inconnu
        const dist = DistanceCalculator.calculateDistance(
          params.clientCoords,
          params.vendorCoords
        )
        return DistanceCalculator.calculateDeliveryFee(dist)
    }
  }
}
