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

// CONSTANTS
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const kHttpPort = process.env.PORT || 1337;

fs.mkdirSync(orgCache.CACHE_PATH, {
  recursive: true
});

const httpServer = polka();
new WSS({ port: 1338 });

httpServer.use(
  sirv(path.join(__dirname, "public"), { dev: true })
);

httpServer.get("/health", (req, res) => {
  send(res, 200, {
    uptime: process.uptime()
  });
});

httpServer.listen(
  kHttpPort,
  () => console.log(`HTTP Server listening on http://localhost:${kHttpPort}`)
);
