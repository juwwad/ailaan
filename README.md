# Ailaan — Next.js Hero Rebuild

A single-viewport, no-scroll hero for Ailaan, the AI-powered flood alert
system for Khyber Pakhtunkhwa. Rebuilt in Next.js (App Router) with a
glassmorphic UI and an embedded live demo of the actual product concept.

## Stack
- Next.js 16 (App Router, Turbopack)
- Tailwind CSS v4
- `geist` (self-hosted Geist Sans + Geist Mono - no Google Fonts network call)
- `lucide-react` for icons (the GitHub mark is a hand-drawn inline SVG,
  since brand logos were removed from recent lucide-react versions)

## What's here
- `app/layout.js` - fonts, metadata, locks page-level scroll
- `app/page.js` - thin wrapper that renders the hero
- `components/Hero.js` - everything: background, header, copy, CTA, and the
  interactive glass demo card (district picker, risk indicator, language
  toggle, text-to-speech playback, WhatsApp subscribe)
- `app/globals.css` - color tokens, glass/pulse/rise utility classes
- `public/logo.webp`, `public/hero-bg.webp` - your provided assets

## Design notes
- **No scroll, both breakpoints:** the hero is locked to `h-dvh` with
  `overflow-hidden` on `<body>`. Below `sm`, the marketing copy compresses
  (shorter headline, hidden trust row) so the interactive demo - the actual
  product - always stays fully visible without scrolling. Tested down to
  360x640.
- **Built for non-literate users:** every district's risk is a color +
  icon (red/amber/green, universal), and the speaker button reads the
  warning aloud via the Web Speech API - no reading required at any step.
- **The CTA *is* the demo:** "Hear a live warning" doesn't link anywhere -
  it triggers the same alert-generation flow as tapping a district chip,
  so the hero's headline promise and its proof are the same action.
- Alert copy and risk levels for the 5 districts are illustrative in the UI
  layer. Real risk levels come from the `backend/` service, which queries the
  Google Flood Forecasting API and falls back to simulated data (flagged as
  such) when that is unavailable.

## Backend
`backend/` is a small, dependency-free Node service that resolves flood status
for a district. The Next.js route `app/api/flood-status` proxies to it.

```bash
cd backend
npm start            # http://localhost:5000
```

Set `GOOGLE_FLOOD_API_KEY` (see `backend/.env.example`) to enable live data.
Without it, responses are served as simulated and flagged `source: "simulated"`.
See `backend/README.md` for the full API contract.

## Run it
Start the backend, then the frontend:

```bash
# terminal 1
cd backend && npm start

# terminal 2
npm install
npm run dev
```

`NEXT_PUBLIC_BACKEND_URL` overrides the backend URL used by the proxy
(defaults to `http://localhost:5000`).

## Build
```bash
npm run build && npm start
```
