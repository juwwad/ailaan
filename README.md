# 🌊 Ailaan - AI-Powered Flood Alert System

**Ailaan** (اعلان - "Announcement" in Urdu/Pashto) is an intelligent flood early warning system designed specifically for Khyber Pakhtunkhwa, Pakistan. It transforms complex technical flood data into simple, actionable warnings in local dialects that save lives.

![Ailaan App](https://img.shields.io/badge/Status-Active-success) ![React](https://img.shields.io/badge/React-18.0-blue) ![License](https://img.shields.io/badge/License-MIT-green)

🔗 **Live Demo:** [https://juwwad.github.io/ailaan](https://juwwad.github.io/ailaan)

---

## 🎯 The Problem

Traditional flood alerts fail in rural Pakistan because:
- ❌ They use technical jargon like "450,000 cusecs" that locals don't understand
- ❌ They're in English or formal Urdu, not local dialects (Pashto/Hindko)
- ❌ They don't provide specific, actionable instructions
- ❌ They don't reach people via accessible channels like WhatsApp

**Result:** People don't know when to evacuate or how much time they have.

---

## ✅ The Solution

Ailaan uses AI to convert technical flood forecasting data into **dialect-specific, actionable warnings** that people actually understand and act upon.

### Before Ailaan:
> "Flood Alert: Kabul River at Nowshera is 450,000 Cusecs. High Flood. Take precautions."

### After Ailaan:
> "🚨 URGENT for Nowshera: The Kabul River water will be waist-deep by Maghrib prayers (6pm). Move your cattle and family to GT Road bypass NOW. You have only 3 hours."

**In Pashto (Roman Script):**
> "Nowshera ta khatarnak khabardari: Kabul River dera ghrandai loredzi. Da Maghrib lamanze pore ba staaso kali ta obah rashi..."

---

## 🌟 Features

### 🗣️ **Multi-Language Support**
- **English** - For urban, educated users
- **Pashto Script (پښتو)** - For native Pashto readers
- **Roman Pashto** - For younger generations who read Pashto in Latin script
- **Audio Alerts** - Voice messages for non-literate communities

### 📍 **District-Specific Alerts**
Current coverage:
- Nowshera (Kabul River)
- Charsadda (Kabul River)
- Swat (Swat River)
- Peshawar (Bara River)
- Mardan (Kalpani River)

### 📱 **WhatsApp Integration** (Coming Soon)
- Subscribe with your phone number
- Receive instant alerts in your preferred language
- No app installation required - works on basic phones

### 🎨 **Smart Translation**
Instead of technical metrics, locals get:
- ✅ Prayer time references (Maghrib, Fajr, Isha)
- ✅ Physical landmarks (GT Road, main bazaar)
- ✅ Relatable measurements (knee-deep, waist-deep)
- ✅ Specific actions (move cattle, keep children safe)
- ✅ Time remaining in simple language

### 🚦 **Risk-Level System**
- 🔴 **High Risk** - Immediate evacuation needed (3 hours)
- 🟡 **Medium Risk** - Prepare and move livestock (6-12 hours)
- 🟢 **Low Risk** - Normal conditions, stay alert

---

## 🏗️ How It Works

```
┌─────────────────────┐
│ Google Flood API    │ ← Satellite data monitoring rivers
│ (Technical Data)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ AI Translation      │ ← Gemini/GPT converts to local dialect
│ (Gemini AI)         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ WhatsApp Delivery   │ ← Sent to village leaders & communities
│ (Twilio API)        │
└─────────────────────┘
```

### Technical Architecture:
1. **Data Source:** Google Flood Forecasting API
2. **AI Processing:** Large Language Model (Gemini/GPT-4) for contextual translation
3. **Frontend:** React.js with Tailwind CSS
4. **Distribution:** WhatsApp Business API (planned)
5. **Hosting:** GitHub Pages

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Git

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/juwwad/ailaan.git
cd ailaan
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start the development server:**
```bash
npm start
```

4. **Open your browser:**
```
http://localhost:3000
```

### Build for Production

```bash
npm run build
```

### Deploy to GitHub Pages

```bash
npm run deploy
```

---

## 🛠️ Technology Stack

| Technology | Purpose |
|------------|---------|
| **React.js** | Frontend framework |
| **Tailwind CSS** | Styling and responsive design |
| **Lucide React** | Icons |
| **Google Flood API** | Real-time flood forecasting data (planned) |
| **Gemini AI** | Technical-to-dialect translation (planned) |
| **Twilio/WhatsApp API** | Message delivery (planned) |

---

## 📋 Roadmap

### Phase 1: ✅ MVP (Current)
- [x] Interactive UI with district selection
- [x] Multi-language alert display
- [x] Risk-level visualization
- [x] Simulated flood data

### Phase 2: 🔄 In Progress
- [ ] Google Flood Forecasting API integration
- [ ] Backend server for AI translation
- [ ] Real-time data processing
- [ ] Historical data charts

### Phase 3: 📅 Planned
- [ ] WhatsApp Business API integration
- [ ] SMS fallback for areas without internet
- [ ] Audio message generation (text-to-speech)
- [ ] Expansion to more districts
- [ ] Mobile app (React Native)

### Phase 4: 🎯 Future
- [ ] Community feedback system
- [ ] Offline mode with cached alerts
- [ ] Integration with local disaster management authorities
- [ ] Rainfall prediction overlay
- [ ] Multilingual support (Hindko, Saraiki)

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch:**
```bash
git checkout -b feature/your-feature-name
```
3. **Make your changes and commit:**
```bash
git commit -m "Add: your feature description"
```
4. **Push to your fork:**
```bash
git push origin feature/your-feature-name
```
5. **Open a Pull Request**

### Areas where we need help:
- 🌐 Pashto/Hindko translation improvements
- 🎨 UI/UX design enhancements
- 📊 Data visualization features
- 🔧 Backend development (Node.js/Python)
- 📱 WhatsApp integration
- 📝 Documentation

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Google Flood Hub** - For providing free flood forecasting data
- **Anthropic (Claude)** - AI assistance in development
- **Local communities in KPK** - For inspiration and real-world insights
- **Open Source Community** - For tools and libraries

---

## 📞 Contact

**Developer:** Jawad Ahmad 
**GitHub:** [@juwwad](https://github.com/juwwad)  
**LinkedIn** [https://linkedin.com/in/juwwad]
**Project Link:** [https://github.com/juwwad/ailaan](https://github.com/juwwad/ailaan)

---

## 🌍 Impact

This project aims to:
- 🛡️ **Save lives** through timely, understandable warnings
- 🗣️ **Bridge the language gap** between technical systems and local communities
- 📱 **Use accessible technology** (WhatsApp) that people already have
- 🌊 **Prevent livestock and property loss** through early action
- 👨‍👩‍👧‍👦 **Protect vulnerable populations** who are most at risk

---

<div align="center">

**Built with ❤️ for the people of Khyber Pakhtunkhwa**

*Because lives matter more than technical data*

[⭐ Star this repo](https://github.com/juwwad/ailaan) | [🐛 Report Bug](https://github.com/juwwad/ailaan/issues) | [💡 Request Feature](https://github.com/juwwad/ailaan/issues)

</div>