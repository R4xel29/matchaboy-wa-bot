import { DELIVERY_CONFIG, STORE } from './constants';

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @returns distance in kilometers
 */
export function calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg: number): number {
    return (deg * Math.PI) / 180;
}

/**
 * Calculate delivery fee based on distance
 * Base fee + per-km fee, with a minimum distance of 1.0 km, and rounded to the nearest Rp 500
 */
export function calculateDeliveryFee(distanceKm: number, perKmFee: number = 2000): number {
    // Minimum 1.0 km distance
    const effectiveDistance = Math.max(1.0, distanceKm);
    const rawFee = effectiveDistance * perKmFee;
    
    // Round to the nearest Rp 500
    return Math.round(rawFee / 500) * 500;
}

/**
 * Check if location is within delivery range
 */
export function isWithinDeliveryRange(distanceKm: number, maxDistanceKm: number = 10): boolean {
    return distanceKm <= maxDistanceKm;
}

/**
 * Calculate distance from store to a given coordinate
 */
export function getDistanceFromStore(lat: number, lng: number): number {
    return calculateDistance(STORE.lat, STORE.lng, lat, lng);
}

/**
 * Generate a deterministic 4-digit verification PIN for an order ID
 */
export function getDeliveryPin(orderId: string): string {
    let hash = 0;
    for (let i = 0; i < orderId.length; i++) {
        hash = orderId.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Ensure it is a 4-digit positive integer
    const pinVal = Math.abs(hash) % 10000;
    return pinVal.toString().padStart(4, '0');
}

