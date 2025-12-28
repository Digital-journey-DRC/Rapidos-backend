export class DistanceCalculator {
    static EARTH_RADIUS_KM = 6371;
    static toRadians(degrees) {
        return (degrees * Math.PI) / 180;
    }
    static calculateDistance(point1, point2) {
        const lat1Rad = this.toRadians(point1.latitude);
        const lat2Rad = this.toRadians(point2.latitude);
        const deltaLatRad = this.toRadians(point2.latitude - point1.latitude);
        const deltaLonRad = this.toRadians(point2.longitude - point1.longitude);
        const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
            Math.cos(lat1Rad) *
                Math.cos(lat2Rad) *
                Math.sin(deltaLonRad / 2) *
                Math.sin(deltaLonRad / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = this.EARTH_RADIUS_KM * c;
        return Math.round(distance * 100) / 100;
    }
    static calculateDeliveryFee(distanceKm) {
        const baseFee = 1000;
        const perKmFee = 1000;
        return baseFee + Math.round(distanceKm * perKmFee);
    }
}
//# sourceMappingURL=distance_calculator.js.map