// Import Node.js Dependencies
import { fileURLToPath } from "node:url";
import path from "node:path";

// Import Third-party Dependencies
import polka from "polka";
import send from "@polka/send";
import sirv from "sirv";

// Import Internal Dependencies
import DataFetcher from "./src/DataFetcher.class.js";
import * as template from "./src/template.js";

// CONSTANTS
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const kHttpPort = process.env.PORT || 1337;
const kDataFetcher = new DataFetcher();

const httpServer = polka();
httpServer.use(
  sirv(path.join(__dirname, "public"), { dev: true })
);

httpServer.get("/health", (req, res) => {
  send(res, 200, {
    uptime: process.uptime()
  });
});

httpServer.get("/", async(req, res) => {
  try {
    const data = await kDataFetcher.getData();

    res.end(template.render(data));
  }
  catch (error) {
    send(res, 500, error.message);
  }
});

httpServer.listen(
  kHttpPort,
  () => console.log(`HTTP Server listening on port: ${kHttpPort}`)
);
