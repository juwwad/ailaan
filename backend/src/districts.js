// Canonical district configuration shared by validation and the Google API client.
// Coordinates are the district centroids used to build the search bounding box.
export const DISTRICTS = {
  nowshera: { name: "Nowshera", lat: 34.0153, lng: 71.9747 },
  charsadda: { name: "Charsadda", lat: 34.1483, lng: 71.7406 },
  peshawar: { name: "Peshawar", lat: 34.0151, lng: 71.5249 },
  swat: { name: "Swat", lat: 35.2227, lng: 72.4258 },
  mardan: { name: "Mardan", lat: 34.1987, lng: 72.0447 },
};

export const DISTRICT_KEYS = Object.keys(DISTRICTS);

// Half-width (in degrees, ~55km) of the square we search around a district centre.
const BOX_HALF = 0.5;

export function boundingBox(districtKey) {
  const d = DISTRICTS[districtKey];
  if (!d) return null;
  return [
    { latitude: d.lat + BOX_HALF, longitude: d.lng - BOX_HALF },
    { latitude: d.lat + BOX_HALF, longitude: d.lng + BOX_HALF },
    { latitude: d.lat - BOX_HALF, longitude: d.lng + BOX_HALF },
    { latitude: d.lat - BOX_HALF, longitude: d.lng - BOX_HALF },
  ];
}

export function isValidDistrict(districtKey) {
  return Object.prototype.hasOwnProperty.call(DISTRICTS, districtKey);
}
