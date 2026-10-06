# Ailaan backend

Flood-status service for Ailaan. It resolves the current flood status for a KPK
district, preferring live data from the [Google Flood Forecasting API](https://developers.google.com/flood-forecasting)
and falling back to clearly-labeled simulated data when that is unavailable.

Zero runtime dependencies — it uses the Node.js standard library and the global
`fetch` (Node 18+).

## Run it

```bash
cd backend
npm start          # or: node server.js
```

The Next.js app proxies `/api/flood-status` to this service, defaulting to
`http://localhost:5000`. Start the backend first, then the frontend.

## Configure it

Copy `.env.example` to `.env` and set `GOOGLE_FLOOD_API_KEY` to enable live
data. Without a key the service still responds, but every response carries
`source: "simulated"` and `simulated: true`.

The service reads configuration from the environment. It does not load `.env`
files itself; use your shell, a process manager, or `node --env-file=.env server.js`.

## API

### `POST /api/flood-status`

Request body:

```json
{ "district": "nowshera", "coordinates": [] }
```

`district` must be one of `nowshera`, `charsadda`, `peshawar`, `swat`, `mardan`.
`coordinates` is accepted for backwards compatibility and currently ignored —
the service derives the search bounding box from the district centroid.

Response (200):

```json
{
  "district": "nowshera",
  "risk": "high",
  "severity": "SEVERITY_ALERT",
  "gaugeLocation": "Nowshera",
  "issuedTime": null,
  "forecastTrend": "RISING",
  "hasInundationMap": false,
  "source": "simulated",
  "simulated": true
}
```

`source` is either `google-flood-forecasting` (live) or `simulated`. The
frontend is expected to label simulated responses rather than present them as a
real warning.

Errors: `400` for an unknown/missing district or malformed JSON, `413` for an
oversized body, `500` for an unexpected failure.

### `GET /health`

```json
{ "status": "ok", "service": "ailaan-backend", "upstream": "configured", "districts": ["nowshera", "..."] }
```

## Tests

```bash
cd backend
npm test
```
