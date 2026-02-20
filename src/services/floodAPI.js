import axios from 'axios';

// Point to your backend instead of Google directly
const BACKEND_URL = 'ailaan-backend-production.up.railway.app';

const DISTRICT_COORDINATES = {
  nowshera: { lat: 34.0153, lng: 71.9747 },
  charsadda: { lat: 34.1483, lng: 71.7406 },
  swat: { lat: 35.2227, lng: 72.4258 },
  peshawar: { lat: 34.0151, lng: 71.5249 },
  mardan: { lat: 34.1987, lng: 72.0447 }
};

export const getFloodStatusByArea = async (districtKey) => {
  const coords = DISTRICT_COORDINATES[districtKey];
  
  const vertices = [
    { latitude: coords.lat + 0.5, longitude: coords.lng - 0.5 },
    { latitude: coords.lat + 0.5, longitude: coords.lng + 0.5 },
    { latitude: coords.lat - 0.5, longitude: coords.lng + 0.5 },
    { latitude: coords.lat - 0.5, longitude: coords.lng - 0.5 }
  ];
  
  try {
    const response = await axios.post(`${BACKEND_URL}/api/flood-status`, {
      district: districtKey,
      coordinates: vertices
    });
    
    return response.data.floodStatuses || [];
  } catch (error) {
    console.error('Error fetching flood status:', error);
    throw error;
  }
};

export const processFloodData = (floodStatus) => {
  if (!floodStatus || floodStatus.length === 0) {
    return null;
  }
  
  const status = floodStatus[0];
  
  const severityMap = {
    'SEVERITY_NORMAL': 'low',
    'SEVERITY_WARNING': 'medium',
    'SEVERITY_ALERT': 'high',
    'SEVERITY_UNKNOWN': 'low'
  };
  
  return {
    severity: severityMap[status.severity] || 'low',
    gaugeLocation: status.gaugeLocation,
    issuedTime: status.issuedTime,
    forecastTrend: status.forecastTrend,
    hasInundationMap: !!status.inundationMapSet
  };
};