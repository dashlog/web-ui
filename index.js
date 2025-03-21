// Import Node.js Dependencies
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

// Import Third-party Dependencies
import polka from "polka";
import send from "@polka/send";
import sirv from "sirv";

// Import Internal Dependencies
import * as orgCache from "./src/cache.js";
import WSS from "./src/WebSocket.class.js";
import { logger } from "./logger.js";

// CONSTANTS
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const kHttpPort = process.env.PORT || 1337;
const kWsPort = process.env.WS_PORT || 1338;

// Ensure cache directory exists
fs.mkdirSync(orgCache.CACHE_PATH, { recursive: true });

// Initialize WebSocket Server
const httpServer = polka();
new WSS({ port: kWsPort });
logger.info(`WebSocket Server running on ws://localhost:${kWsPort}`);

// Serve static files
httpServer.use(sirv(path.join(__dirname, "public"), { dev: true }));

// Health check endpoint
httpServer.get("/health", (req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({
    status: "OK",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  }));
});

// Global error handling
httpServer.use((err, req, res, next) => {
  logger.error(`[Server Error] ${err.message}`);
  res.writeHead(500, { "Content-Type": "application/json" });
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ error: "Internal Server Error" }));
});

// Start HTTP server
httpServer.listen(kHttpPort, () => {
  logger.info(`HTTP Server listening on http://localhost:${kHttpPort}`);
});
