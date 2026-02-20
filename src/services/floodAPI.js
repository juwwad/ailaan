import axios from 'axios';

const API_BASE_URL = 'https://floodforecasting.googleapis.com/v1';
const API_KEY = process.env.REACT_APP_GOOGLE_FLOOD_API_KEY;

// Pakistan's region code
const PAKISTAN_REGION_CODE = 'PK';

// Coordinates for KPK districts (approximate bounding boxes)
const DISTRICT_COORDINATES = {
  nowshera: {
    lat: 34.0153,
    lng: 71.9747
  },
  charsadda: {
    lat: 34.1483,
    lng: 71.7406
  },
  swat: {
    lat: 35.2227,
    lng: 72.4258
  },
  peshawar: {
    lat: 34.0151,
    lng: 71.5249
  },
  mardan: {
    lat: 34.1987,
    lng: 72.0447
  }
};

// Function 1: Search for gauges in Pakistan/KPK
export const searchGaugesInPakistan = async () => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/gauges:searchGaugesByArea?key=${API_KEY}`,
      {
        regionCode: PAKISTAN_REGION_CODE,
        includeNonQualityVerified: true, // Include lower confidence gauges for better coverage
        pageSize: 100 // Get up to 100 gauges
      }
    );
    
    return response.data.gauges || [];
  } catch (error) {
    console.error('Error fetching gauges:', error);
    throw error;
  }
};

// Function 2: Get flood status for a specific area
export const getFloodStatusByArea = async (districtKey) => {
  const coords = DISTRICT_COORDINATES[districtKey];
  
  try {
    const response = await axios.post(
      `${API_BASE_URL}/floodStatus:searchLatestFloodStatusByArea?key=${API_KEY}`,
      {
        loop: {
          vertices: [
            // Create a small bounding box around the district center
            { latitude: coords.lat + 0.5, longitude: coords.lng - 0.5 },
            { latitude: coords.lat + 0.5, longitude: coords.lng + 0.5 },
            { latitude: coords.lat - 0.5, longitude: coords.lng + 0.5 },
            { latitude: coords.lat - 0.5, longitude: coords.lng - 0.5 }
          ]
        },
        includeNonQualityVerified: true
      }
    );
    
    return response.data.floodStatuses || [];
  } catch (error) {
    console.error('Error fetching flood status:', error);
    throw error;
  }
};

// Function 3: Get gauge forecast (7-day forecast)
export const getGaugeForecast = async (gaugeId) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/gauges:queryGaugeForecasts?key=${API_KEY}`,
      {
        gaugeId: gaugeId
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fetching forecast:', error);
    throw error;
  }
};

// Function 4: Convert technical data to simple metrics
export const processFloodData = (floodStatus) => {
  if (!floodStatus || floodStatus.length === 0) {
    return null;
  }
  
  const status = floodStatus[0]; // Get the first status
  
  // Map severity levels
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