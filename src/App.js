import React, { useEffect, useState } from 'react';
import { AlertTriangle, Droplets, MapPin, Send, Volume2, Clock, Users, Phone } from 'lucide-react';
import { getFloodStatusByArea, processFloodData } from './services/floodAPI';

const STATS_STORAGE_KEY = 'ailaan_system_stats_v1';
const STATS_WINDOW_MS = 24 * 60 * 60 * 1000;

const getInitialSystemStats = () => {
  const now = Date.now();

  if (typeof window === 'undefined') {
    return { windowStart: now, alertsSentToday: 0, subscribers: 0 };
  }

  try {
    const stored = window.localStorage.getItem(STATS_STORAGE_KEY);
    if (!stored) {
      return { windowStart: now, alertsSentToday: 0, subscribers: 0 };
    }

    const parsed = JSON.parse(stored);
    const windowStart = Number(parsed.windowStart) || now;
    const subscribers = Number(parsed.subscribers) || 0;
    const alertsSentToday = Number(parsed.alertsSentToday) || 0;

    if (now - windowStart >= STATS_WINDOW_MS) {
      return { windowStart: now, alertsSentToday: 0, subscribers };
    }

    return { windowStart, alertsSentToday, subscribers };
  } catch {
    return { windowStart: now, alertsSentToday: 0, subscribers: 0 };
  }
};

const KPKFloodRelay = () => {
  const [selectedDistrict, setSelectedDistrict] = useState('nowshera');
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [language, setLanguage] = useState('both');
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState({});
  const [systemStats, setSystemStats] = useState(getInitialSystemStats);

  const districts = {
    nowshera: { name: 'Nowshera', river: 'Kabul River', risk: 'high', discharge: 450000 },
    charsadda: { name: 'Charsadda', river: 'Kabul River', risk: 'medium', discharge: 320000 },
    swat: { name: 'Swat', river: 'Swat River', risk: 'low', discharge: 180000 },
    peshawar: { name: 'Peshawar', river: 'Bara River', risk: 'medium', discharge: 250000 },
    mardan: { name: 'Mardan', river: 'Kalpani River', risk: 'low', discharge: 150000 }
  };

  const [districtRisks, setDistrictRisks] = useState(
    Object.fromEntries(Object.keys(districts).map((key) => [key, null]))
  );

  useEffect(() => {
    window.localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(systemStats));
  }, [systemStats]);

  const normalizeRisk = (risk) => {
    const value = String(risk || '').toLowerCase();
    if (value === 'high' || value === 'medium' || value === 'low') {
      return value;
    }
    return 'low';
  };

const generateAlert = async (district) => {
  // Check if we fetched this district in the last hour
  const now = Date.now();
  if (lastFetch[district] && (now - lastFetch[district] < 3600000)) { // 1 hour
    alert('Data was fetched recently. Please wait before refreshing.');
    return;
  }
  setLoading(true);
  setError(null);
  
  try {
    // 1. Fetch real flood data from Google API
    const floodStatuses = await getFloodStatusByArea(district);
    
    // 2. Process the data
    const processedData = processFloodData(floodStatuses);
    
    // 3. If no data, show message
    if (!processedData) {
      alert(`No flood data available for ${districts[district].name} at this time.`);
      setLoading(false);
      return;
    }
    
    // 4. Get district data
    const data = districts[district];
    
    // 5. Determine risk level from API data
    const riskLevel = normalizeRisk(processedData.severity);
    
    // 6. Generate localized alerts based on real risk level
    const alertTemplates = {
      high: {
        english: `URGENT ALERT for ${data.name}: The ${data.river} is rising VERY FAST and will overflow by Maghrib prayers (around 6pm). Water will reach 3 feet above normal - knee to waist deep in low areas. Move your cattle and family to the GT Road bypass NOW. You have only 3 hours.`,
        pashto: `${data.name} ته خطرناک خبرداری: ${data.river} ډېره ګړندۍ لوړېږي او د مغرب لمانځه (شاوخوا 6 بجے) پورې به یې اوبه راځي. اوبه به د معمول څخه 3 فټه لوړې وي - ټیټو سیمو کې د زنګون څخه تر کمر پورې. خپل څاروي او کورنۍ همدا اوس جي ټي روډ بای پاس ته ولیږدئ. تاسو ته یوازې 3 ساعته وخت دی.`,
        roman: `${data.name} ta khatarnak khabardari: ${data.river} dera ghrandai loredzi aw da maghrib lamanze (shawkhuwa 6 baje) pore ba ye obah razi. Obah ba da mamool tsokh 3 foot lware wi - teto seemo ke da zangoon tsokh tar kamar pore. Khpal tsarwi aw koranai hamda os GT Road bypass ta walegday. Taso ta yawaze 3 sa'ata waqt day.`,
        audio: `السلام علیکم! ${data.name} ورونو او خویندو! ${data.river} ډېره ګړندۍ لوړېږي. د مغرب لمانځه پورې به ستاسو کلي ته اوبه راشي...`,
        audioRoman: `Assalam-o-Alaikum! ${data.name} wrono aw khwendo! ${data.river} dera ghrandai loredzi...`
      },
      medium: {
        english: `Flood WARNING for ${data.name}: The ${data.river} is rising and low-lying areas may flood within the next 6 to 12 hours. Keep your emergency items ready and move livestock to higher ground if water levels continue to increase.`,
        pashto: `${data.name} لپاره د سېلاب خبرداری: ${data.river} اوبه لوړېږي او ټیټې سیمې د راتلونکو 6 تر 12 ساعتونو کې تر اوبو لاندې کېدای شي. د بیړني حالت سامان چمتو وساتئ او که اوبه نورې هم لوړېږي نو څاروي لوړو ځایونو ته انتقال کړئ.`,
        roman: `${data.name} lapara da selab khabardari: ${data.river} obah lwaregi aw teto seeme da ratlonko 6 تر 12 sa'ato ke tar obo lande keday shi. Da beyrani halat saman chمتo وساتئ aw ka obah nore ham lwaregi نو tsarwi loro zayoono ta intiqal krei.`,
        audio: `السلام علیکم! ${data.name} کې د سېلاب منځنی خطر شته. مهرباني وکړئ چمتووالی ونیسئ او ټیټې سیمې پرېږدئ که اوبه نورې هم لوړېږي.`,
        audioRoman: `Assalam-o-Alaikum! ${data.name} ke da selab manzani khatar شته. Mehrabani wakri chamtowalay waneesai aw teto seeme preghdai ka obah nore ham lwaregi.`
      },
      low: {
        english: `Update for ${data.name}: Flood risk is currently LOW on the ${data.river}. Stay aware, monitor official updates, and keep your family emergency contacts ready as a precaution.`,
        pashto: `${data.name} تازه معلومات: د ${data.river} په اوږدو کې اوس مهال د سېلاب خطر کم دی. خبرتیاوې تعقیب کړئ او د احتیاط لپاره د کورنۍ بیړني اړیکې تیارې وساتئ.`,
        roman: `${data.name} taza maloomat: da ${data.river} pa ogdo ke os mahal da selab khatar kam day. Khabartyawi tawqub krei aw da ihtiyat lapara da کورنۍ beyrani arike tayare وساتئ.`,
        audio: `السلام علیکم! ${data.name} کې د سېلاب خطر اوس کم دی، خو مهرباني وکړئ رسمي خبرتیاوې تعقیب کړئ.`,
        audioRoman: `Assalam-o-Alaikum! ${data.name} ke da selab khatar os kam day, kho mehrabani wakri rasmi khabartyawi taqub krei.`
      }
    };

    const selectedTemplate = alertTemplates[riskLevel] || alertTemplates.low;
    
    // 7. Create alert with real data
    const newAlert = {
      id: Date.now(),
      createdAt: now,
      district: data.name,
      river: data.river,
      risk: riskLevel,
      discharge: data.discharge, // You could calculate this from API data if available
      timestamp: new Date().toLocaleString(),
      apiData: processedData, // Include raw API data
      ...selectedTemplate
    };
    
    setAlerts(prev => [newAlert, ...prev]);
    setDistrictRisks(prev => ({ ...prev, [district]: riskLevel }));
    setLastFetch(prev => ({ ...prev, [district]: now }));
    setSystemStats((prev) => {
      const currentTime = Date.now();
      const expired = currentTime - prev.windowStart >= STATS_WINDOW_MS;
      const base = expired
        ? { ...prev, windowStart: currentTime, alertsSentToday: 0 }
        : prev;

      return { ...base, alertsSentToday: base.alertsSentToday + 1 };
    });
    
  } catch (error) {
    console.error('Error generating alert:', error);
    setError('Failed to fetch flood data. Please check your internet connection and try again.');
  }
  
  setLoading(false);
};

  const handleSubscribe = () => {
    if (subscribed) {
      return;
    }

    if (phoneNumber.length < 10) {
      setError('Please enter a valid phone number to subscribe.');
      return;
    }

    setError(null);
    setSubscribed(true);
    setSystemStats((prev) => ({ ...prev, subscribers: prev.subscribers + 1 }));
  };

  const playAudioAlert = (message) => {
    if (!message) {
      setError('No audio alert message is available.');
      return;
    }

    if (!('speechSynthesis' in window)) {
      setError('Audio playback is not supported in this browser.');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  };

  const getRiskColor = (risk) => {
    switch(risk) {
      case 'high': return 'bg-red-100 border-red-500 text-red-900';
      case 'medium': return 'bg-yellow-100 border-yellow-500 text-yellow-900';
      case 'low': return 'bg-green-100 border-green-500 text-green-900';
      default: return 'bg-gray-100 border-gray-500 text-gray-900';
    }
  };

  const getRiskBadge = (risk) => {
    switch(risk) {
      case 'high': return 'bg-red-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const currentDistrictRisk = districtRisks[selectedDistrict];
  const activeDistrictsCount = Object.keys(districts).length;
  const subscriberCount = systemStats.subscribers;
  const alertsSentToday = systemStats.alertsSentToday;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
      <div className="max-w-6xl mx-auto">
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded mb-4">
            <p className="text-red-900">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Droplets className="w-10 h-10 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">Ailaan</h1>
          </div>
          <p className="text-gray-600">AI-Powered Flood Alert System for Khyber Pakhtunkhwa</p>
          <div className="mt-4 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-sm text-blue-900">
              <strong>How it works:</strong> This system converts technical flood data into simple, actionable warnings in local dialect. Instead of "450,000 cusecs", people hear "water will be waist-deep by Maghrib prayers - move to GT Road NOW."
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-800">Select District</h2>
            </div>
            <select 
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(districts).map(([key, data]) => (
                <option key={key} value={key}>
                  {data.name} - {data.river}
                </option>
              ))}
            </select>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Current Risk Level:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getRiskBadge(currentDistrictRisk || 'unknown')}`}>
                  {currentDistrictRisk || '--'}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <p><strong>Discharge:</strong> {districts[selectedDistrict].discharge.toLocaleString()} cusecs</p>
              </div>
            </div>

            <button 
              onClick={() => generateAlert(selectedDistrict)}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Generating Alert...
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5" />
                  Check Flood Status
                </>
              )}
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Phone className="w-5 h-5 text-green-600" />
              <h2 className="text-xl font-bold text-gray-800">WhatsApp Alerts</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Get instant flood alerts on WhatsApp
            </p>
            
            <div className="mb-4">
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Alert Language:</label>
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
              >
                <option value="both">English + Pashto Script + Roman Pashto</option>
                <option value="pashto">Pashto Script Only (پښتو)</option>
                <option value="roman">Roman Pashto Only (Latin)</option>
              </select>
            </div>
            
            <input
              type="tel"
              placeholder="03XX-XXXXXXX"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-green-500"
              disabled={subscribed}
            />
            <button 
              onClick={handleSubscribe}
              disabled={subscribed || phoneNumber.length < 10}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400 flex items-center justify-center gap-2"
            >
              {subscribed ? (
                <>✓ Subscribed</>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Subscribe to Alerts
                </>
              )}
            </button>
            {subscribed && (
              <p className="text-xs text-green-600 mt-2 text-center">
                ✓ You will receive alerts in {language === 'both' ? 'all formats' : language === 'pashto' ? 'Pashto script' : 'Roman Pashto'}
              </p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-purple-600" />
              <h2 className="text-xl font-bold text-gray-800">System Stats</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-sm text-gray-600">Active Districts</span>
                <span className="text-xl font-bold text-purple-600">{activeDistrictsCount}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-sm text-gray-600">Subscribers</span>
                <span className="text-xl font-bold text-blue-600">{subscriberCount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-gray-600">Alerts Sent Today</span>
                <span className="text-xl font-bold text-green-600">{alertsSentToday.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Recent Alerts</h2>
          {alerts.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <AlertTriangle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No alerts yet. Click "Check Flood Status" to generate an alert.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div key={alert.id} className={`border-l-4 rounded-lg p-4 ${getRiskColor(alert.risk)}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${getRiskBadge(alert.risk)}`}>
                          {alert.risk}
                        </span>
                        <span className="font-bold">{alert.district}</span>
                      </div>
                      <p className="text-xs opacity-75 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {alert.timestamp}
                      </p>
                    </div>
                    <button 
                      onClick={() => playAudioAlert(language === 'roman' ? alert.audioRoman : alert.audio)}
                      className="bg-white bg-opacity-50 hover:bg-opacity-100 p-2 rounded-full transition"
                      title={`Play ${language === 'roman' ? 'Roman' : 'Pashto'} audio alert`}
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-white bg-opacity-50 rounded p-3">
                      <p className="text-xs font-semibold mb-1">English:</p>
                      <p className="text-sm">{alert.english}</p>
                    </div>
                    
                    {(language === 'both' || language === 'pashto') && (
                      <div className="bg-white bg-opacity-50 rounded p-3" dir="rtl">
                        <p className="text-xs font-semibold mb-1" dir="ltr">Pashto Script (پښتو):</p>
                        <p className="text-sm">{alert.pashto}</p>
                      </div>
                    )}
                    
                    {(language === 'both' || language === 'roman') && (
                      <div className="bg-white bg-opacity-50 rounded p-3">
                        <p className="text-xs font-semibold mb-1">Roman Pashto (Latin):</p>
                        <p className="text-sm font-mono">{alert.roman}</p>
                      </div>
                    )}
                    
                    <div className="text-xs opacity-75">
                      <strong>River:</strong> {alert.river} | <strong>Technical Data:</strong> {alert.discharge.toLocaleString()} cusecs (translated above for local understanding)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold mb-3">How Ailaan Works</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-semibold mb-1">1. Data Collection</p>
              <p className="opacity-90">Google Flood Forecasting API monitors rivers via satellite</p>
            </div>
            <div>
              <p className="font-semibold mb-1">2. AI Translation</p>
              <p className="opacity-90">Gemini AI converts technical data into actionable warnings in Pashto (script & Roman)</p>
            </div>
            <div>
              <p className="font-semibold mb-1">3. WhatsApp Delivery</p>
              <p className="opacity-90">Alerts sent directly to village leaders and communities</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KPKFloodRelay;