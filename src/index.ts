// Import Node.js Dependencies
import path from "node:path";
import fs from "node:fs";

// Import Third-party Dependencies
import Fastify from "fastify";
import { fastifyStatic } from "@fastify/static";

// Import Internal Dependencies
import * as orgCache from "./cache.ts";
import WSS from "./websocket/WebSocket.class.ts";

fs.mkdirSync(orgCache.CACHE_PATH, {
  recursive: true
});

const httpServer = Fastify({
  logger: true
});
new WSS({ port: 1338 }, httpServer.log);

httpServer.register(fastifyStatic, {
  root: path.join(import.meta.dirname, "..", "public")
});

httpServer.get("/health", async() => {
  return {
    uptime: process.uptime()
  };
});

try {
  httpServer.listen({
    port: Number(process.env.PORT || 1337)
  });
}
catch (err) {
  httpServer.log.error(err);
  process.exit(1);
}
