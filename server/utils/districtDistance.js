// server/utils/districtDistance.js
// Real great-circle distance between Sri Lankan districts, using their
// approximate town-centre coordinates. Shared by any route that needs to
// rank blood banks / hospitals / donors by proximity (nearby-blood-banks,
// donor request matching, etc). Kept in sync with routes/locations.js.

const DISTRICT_COORDS = {
  Colombo: [6.9271, 79.8612], Gampaha: [7.0917, 79.9999], Kalutara: [6.5854, 79.9607],
  Kandy: [7.2906, 80.6337], Matale: [7.4675, 80.6234], 'Nuwara Eliya': [6.9497, 80.7891],
  Galle: [6.0535, 80.2210], Matara: [5.9485, 80.5353], Hambantota: [6.1241, 81.1185],
  Jaffna: [9.6615, 80.0255], Kilinochchi: [9.3961, 80.3982], Mannar: [8.9810, 79.9044],
  Vavuniya: [8.7514, 80.4971], Mullaitivu: [9.2671, 80.8142],
  Batticaloa: [7.7170, 81.6924], Ampara: [7.2975, 81.6747], Trincomalee: [8.5874, 81.2152],
  Kurunegala: [7.4818, 80.3609], Puttalam: [8.0362, 79.8283],
  Anuradhapura: [8.3114, 80.4037], Polonnaruwa: [7.9403, 81.0188],
  Badulla: [6.9934, 81.0550], Monaragala: [6.8714, 81.3507],
  Ratnapura: [6.6828, 80.3992], Kegalle: [7.2513, 80.3464],
};

function toRad(deg) { return (deg * Math.PI) / 180; }

// Haversine distance in km between two districts. Returns null if either
// district isn't recognised (so callers can fall back gracefully instead of
// showing a fabricated number).
function districtDistanceKm(districtA, districtB) {
  const a = DISTRICT_COORDS[districtA];
  const b = DISTRICT_COORDS[districtB];
  if (!a || !b) return null;
  if (districtA === districtB) return 0;

  const R = 6371; // Earth radius in km
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return Math.round(R * c);
}

module.exports = { DISTRICT_COORDS, districtDistanceKm };