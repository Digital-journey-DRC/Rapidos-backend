/**
 * Service pour calculer la distance entre deux points GPS
 * Utilise la formule de Haversine
 */

export interface GPSCoordinates {
  latitude: number
  longitude: number
}

export class DistanceCalculator {
  /**
   * Rayon de la Terre en kilomètres
   */
  private static readonly EARTH_RADIUS_KM = 6371

  /**
   * Convertit des degrés en radians
   */
  private static toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180
  }

  /**
   * Calcule la distance en kilomètres entre deux points GPS
   * en utilisant la formule de Haversine
   *
   * @param point1 Premier point GPS (latitude, longitude)
   * @param point2 Deuxième point GPS (latitude, longitude)
   * @returns Distance en kilomètres (arrondie à 2 décimales)
   */
  static calculateDistance(point1: GPSCoordinates, point2: GPSCoordinates): number {
    const lat1Rad = this.toRadians(point1.latitude)
    const lat2Rad = this.toRadians(point2.latitude)
    const deltaLatRad = this.toRadians(point2.latitude - point1.latitude)
    const deltaLonRad = this.toRadians(point2.longitude - point1.longitude)

    // Formule de Haversine
    const a =
      Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
      Math.cos(lat1Rad) *
        Math.cos(lat2Rad) *
        Math.sin(deltaLonRad / 2) *
        Math.sin(deltaLonRad / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    const distance = this.EARTH_RADIUS_KM * c

    // Arrondir à 2 décimales
    return Math.round(distance * 100) / 100
  }

  /**
   * Calcule les frais de livraison en fonction de la distance
   * Formule : 1000 FC + (distance_km × 1000 FC)
   *
   * @param distanceKm Distance en kilomètres
   * @returns Frais de livraison en FC
   */
  static calculateDeliveryFee(distanceKm: number): number {
    const baseFee = 1000
    const perKmFee = 1000
    return baseFee + Math.round(distanceKm * perKmFee)
  }
}
