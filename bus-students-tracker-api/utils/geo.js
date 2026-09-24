/**
 * GEOSPATIAL UTILITIES
 * Phase 11: Live Transport Monitoring
 * 
 * Haversine distance calculations and coordinate geometry utilities
 * for bus tracking, ETA calculation, and route deviation detection.
 */

/**
 * Calculate distance in meters between two lat/lng pairs using Haversine formula.
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} Distance in meters
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return 0;
  const pLat1 = parseFloat(lat1);
  const pLon1 = parseFloat(lon1);
  const pLat2 = parseFloat(lat2);
  const pLon2 = parseFloat(lon2);
  if (isNaN(pLat1) || isNaN(pLon1) || isNaN(pLat2) || isNaN(pLon2)) return 0;

  const R = 6371000; // Earth radius in meters
  const dLat = (pLat2 - pLat1) * Math.PI / 180;
  const dLon = (pLon2 - pLon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(pLat1 * Math.PI / 180) * Math.cos(pLat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Calculate distance in kilometers between two lat/lng pairs.
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  return calculateHaversineDistance(lat1, lon1, lat2, lon2) / 1000;
}

/**
 * Standard anchor coordinates for VSB Engineering College transport network in Karur
 */
const VSB_LOCATIONS = {
  KARUR_BUS_STAND: { latitude: 10.9574, longitude: 78.0815, name: 'Karur Central Bus Stand' },
  THANTHONIMALAI: { latitude: 10.9320, longitude: 78.0864, name: 'Thanthonimalai' },
  RAYANUR_JUNCTION: { latitude: 10.9150, longitude: 78.0890, name: 'Rayanur Junction' },
  GANDHIGRAMAM: { latitude: 10.9020, longitude: 78.0930, name: 'Gandhigramam Roundana' },
  VSB_CAMPUS: { latitude: 10.8756, longitude: 78.1024, name: 'V.S.B. Engineering College Main Gate' }
};

module.exports = {
  calculateHaversineDistance,
  calculateDistance,
  VSB_LOCATIONS
};
