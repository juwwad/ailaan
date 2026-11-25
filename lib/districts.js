// Canonical district configuration shared by the route handler and tests.
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
  // hasOwn, not a truthiness check: `DISTRICTS["constructor"]` resolves to the
  // Object constructor and would otherwise produce NaN vertices (#113).
  if (!Object.hasOwn(DISTRICTS, districtKey)) return null;
  const d = DISTRICTS[districtKey];
  return [
    { latitude: d.lat + BOX_HALF, longitude: d.lng - BOX_HALF },
    { latitude: d.lat + BOX_HALF, longitude: d.lng + BOX_HALF },
    { latitude: d.lat - BOX_HALF, longitude: d.lng + BOX_HALF },
    { latitude: d.lat - BOX_HALF, longitude: d.lng - BOX_HALF },
  ];
}

export function isValidDistrict(districtKey) {
  return typeof districtKey === "string" && Object.hasOwn(DISTRICTS, districtKey);
}
