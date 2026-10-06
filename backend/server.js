import http from "node:http";
import { isValidDistrict, DISTRICT_KEYS } from "./src/districts.js";
import { getFloodStatus } from "./src/floodStatus.js";

const PORT = process.env.PORT || 5000;
const API_KEY = process.env.GOOGLE_FLOOD_API_KEY;
const UPSTREAM_TIMEOUT_MS = Number(process.env.UPSTREAM_TIMEOUT_MS || 10000);

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
    "Access-Control-Allow-Origin": process.env.CORS_ORIGIN || "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  });
  res.end(payload);
}

function readJsonBody(req, limitBytes = 1_000_000) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limitBytes) {
        reject(Object.assign(new Error("Request body too large"), { statusCode: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8").trim();
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(Object.assign(new Error("Malformed JSON body"), { statusCode: 400 }));
      }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  if (req.method === "GET" && pathname === "/health") {
    sendJson(res, 200, {
      status: "ok",
      service: "ailaan-backend",
      upstream: API_KEY ? "configured" : "not-configured",
      districts: DISTRICT_KEYS,
    });
    return;
  }

  if (req.method === "POST" && pathname === "/api/flood-status") {
    let body;
    try {
      body = await readJsonBody(req);
    } catch (error) {
      sendJson(res, error.statusCode || 400, { error: error.message });
      return;
    }

    const { district } = body;
    if (!district || !isValidDistrict(district)) {
      sendJson(res, 400, {
        error: `Unknown or missing district. Expected one of: ${DISTRICT_KEYS.join(", ")}`,
      });
      return;
    }

    try {
      const status = await getFloodStatus(district, {
        apiKey: API_KEY,
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      });
      sendJson(res, 200, status);
    } catch (error) {
      sendJson(res, 500, { error: "Failed to resolve flood status" });
    }
    return;
  }

  sendJson(res, 404, { error: "Not found" });
});

// Only listen when executed directly, so tests can import the module freely.
const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  server.listen(PORT, () => {
    console.log(`ailaan-backend listening on http://localhost:${PORT}`);
    console.log(`Google Flood API key: ${API_KEY ? "configured" : "NOT configured (serving simulated data)"}`);
  });
}

export { server, readJsonBody };
