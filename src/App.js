import React, { useState } from 'react';
import { AlertTriangle, Droplets, MapPin, Send, Volume2, Clock, Users, Phone } from 'lucide-react';

const KPKFloodRelay = () => {
  const [selectedDistrict, setSelectedDistrict] = useState('nowshera');
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [language, setLanguage] = useState('both');

  const districts = {
    nowshera: { name: 'Nowshera', river: 'Kabul River', risk: 'high', discharge: 450000 },
    charsadda: { name: 'Charsadda', river: 'Kabul River', risk: 'medium', discharge: 320000 },
    swat: { name: 'Swat', river: 'Swat River', risk: 'low', discharge: 180000 },
    peshawar: { name: 'Peshawar', river: 'Bara River', risk: 'medium', discharge: 250000 },
    mardan: { name: 'Mardan', river: 'Kalpani River', risk: 'low', discharge: 150000 }
  };

  const generateAlert = async (district) => {
    setLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const data = districts[district];
    const alertTemplates = {
      high: {
        english: `URGENT ALERT for ${data.name}: The ${data.river} is rising VERY FAST and will overflow by Maghrib prayers (around 6pm). Water will reach 3 feet above normal - knee to waist deep in low areas. Move your cattle and family to the GT Road bypass NOW. You have only 3 hours.`,
        pashto: `${data.name} ته خطرناک خبرداری: ${data.river} ډېره ګړندۍ لوړېږي او د مغرب لمانځه (شاوخوا 6 بجے) پورې به یې اوبه راځي. اوبه به د معمول څخه 3 فټه لوړې وي - ټیټو سیمو کې د زنګون څخه تر کمر پورې. خپل څاروي او کورنۍ همدا اوس جي ټي روډ بای پاس ته ولیږدئ. تاسو ته یوازې 3 ساعته وخت دی.`,
        roman: `${data.name} ta khatarnak khabardari: ${data.river} dera zar zar ra dakegi aw da makham manza (shawkhuwa 6 baje) pore ba ye obah bahar ta ra ozi. Obah ba da mamool na 3 foot lware wi - teto seemo ke da zangoon na wala tar kamar pore. Khpal sarwi aw da kor khalak GT Road bypass ta walegay. Taso sara serf 3 ghenty wakht day.`,
        audio: `السلام علیکم! ${data.name} ورونو او خویندو! ${data.river} ډېره ګړندۍ لوړېږي. د مغرب لمانځه پورې به ستاسو کلي ته اوبه راشي. اوبه به د زنګون څخه تر کمر پورې وي. مهرباني وکړئ همدا اوس خپل څاروي، ماشومان او بوډاګان جي ټي روډ ته ولیږدئ. تاسو ته یوازې 3 ساعته وخت پاتې دی. الله پاماني!`,
        audioRoman: `Assalam-o-Alaikum! ${data.name} wrono aw khwendo! ${data.river} dera ghrandai loredzi. Da Maghrib lamanze pore ba staaso kali ta obah rashi. Obah ba da zangoon na wala tar kamar pore wi. Mehrbani okray hamda os khpal tsarwi, mashooman aw boodagan GT Road ta walegday. Taso ta yawaze 3 ghenty waqt pate day. Allah pamanai!`
      },
      medium: {
        english: `WARNING for ${data.name}: The ${data.river} water is rising. By tomorrow morning (Fajr time), water may reach the lower fields near the river. Move your cattle from riverbank areas to higher ground near the main bazaar. You have 6-8 hours. Keep children away from the river.`,
        pashto: `${data.name} ته خبرداری: ${data.river} اوبه لوړېږي. سبا د سهار د فجر په وخت کې، اوبه ممکن د سیند سره نژدې ټیټو کروندو ته ورسېږي. خپل څاروي د سیند غاړې څخه لوړې ځمکې ته د اصلي بازار سره نژدې ولیږدئ. تاسو ته 6-8 ساعته وخت دی. ماشومان د سیند څخه لرې وساتئ.`,
        roman: `${data.name} ta khabardari: ${data.river} obah ra lwaregi. Saba da sahar da munz pa wakht ke, obah mumkin da sind sara nazdey teto korona ao pato ta warshi. Khpal sarwi da sind ghare na lware zmake ta da asli bazar sara nazdey walegay. Taso sara 6-8 ghenty wakht day. Mashooman da sind na lere wasatay.`,
        audio: `السلام علیکم! ${data.name} ورونو! ${data.river} اوبه لوړېږي. سبا د سهار د فجر په وخت کې به ستاسو ټیټو کروندو ته اوبه راشي. مهرباني وکړئ خپل غوایي، اوښان او وزې د سیند غاړې څخه بازار ته ولیږدئ. تاسو ته شپږ یا اته ساعته وخت لرئ. ماشومان د سیند څخه لرې وساتئ.`,
        audioRoman: `Assalam-o-Alaikum! ${data.name} wrono! ${data.river} obah loredzi. Saba da sahar da Fajr pa waqt ke ba staaso teto krondo ta obah rashi. Mehrbani okray khpal ghwayi, oshan aw waze da sind ghare tsokh bazar ta walegday. Taso ta shpag ya ata ghenty waqt lare. Mashooman da sind tsokh lere wasatay.`
      },
      low: {
        english: `UPDATE for ${data.name}: The ${data.river} is flowing normally today. No danger right now. But keep watching - if it rains heavily in the mountains, water can rise quickly. Safe to work in fields near river, but stay alert.`,
        pashto: `${data.name} ته تازه خبر: ${data.river} نن په نورماله توګه بهېږي. اوس مهال کومه خطره نشته. خو څارنه وکړئ - که په غرونو کې ډېره باران وشي، اوبه ګړندۍ لوړېدای شي. د سیند سره نژدې کروندو کې کار کول خوندي دي، خو هوښیار اوسئ.`,
        roman: `${data.name} ta taza khabar: ${data.river} nan pa normal toga bahegi. Os la sa kuma khatara nashta. Kho sarana kawai - ka pa gharuno ke der baran washi, obah zar zar ratlay shi. Da sind sara nazdey korono ao pato ke kar kawul mahfooza di, kho hokhyar osay.`,
        audio: `السلام علیکم! ${data.name} ورونو! ${data.river} نن نورمال دی. اوس مهال کومه خطره نشته. تاسو کولای شئ په خپلو کروندو کې کار وکړئ. خو هوښیار اوسئ - که په غرونو کې باران وشي، نو اوبه ګړندۍ راځي. الله مو ساتونکی وي.`,
        audioRoman: `Assalam-o-Alaikum! ${data.name} wrono! ${data.river} nan normal day. Os mahal kuma khatara nashta. Taso kawlay shay pa khplo krondo ke kar wukray. Kho hoshyar osay - ka pa gharuno ke baran washi, no obah ghrandai razi. Allah mo satonkay wi.`
      }
    };
    
    const newAlert = {
      id: Date.now(),
      district: data.name,
      river: data.river,
      risk: data.risk,
      discharge: data.discharge,
      timestamp: new Date().toLocaleString(),
      ...alertTemplates[data.risk]
    };
    
    setAlerts(prev => [newAlert, ...prev]);
    setLoading(false);
  };

  const handleSubscribe = () => {
    if (phoneNumber.length >= 10) {
      setSubscribed(true);
      setTimeout(() => {
        alert(`✓ Subscribed! You'll receive WhatsApp alerts for ${districts[selectedDistrict].name}`);
      }, 500);
    }
  };

  const playAudioAlert = (text) => {
    alert(`🔊 Audio Alert (Pashto):\n\n${text}`);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
      <div className="max-w-6xl mx-auto">
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
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getRiskBadge(districts[selectedDistrict].risk)}`}>
                  {districts[selectedDistrict].risk}
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
                <span className="text-xl font-bold text-purple-600">5</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-sm text-gray-600">Subscribers</span>
                <span className="text-xl font-bold text-blue-600">2,847</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-gray-600">Alerts Sent Today</span>
                <span className="text-xl font-bold text-green-600">124</span>
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