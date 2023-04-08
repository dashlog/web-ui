// Import Node.js Dependencies
import { fileURLToPath } from "node:url";
import path from "node:path";

// Import Third-party Dependencies
import polka from "polka";
import send from "@polka/send";
import sirv from "sirv";
import { WebSocketServer } from "ws";

// Import Internal Dependencies
import DataFetcher from "./src/DataFetcher.class.js";
import * as template from "./src/template.js";

// CONSTANTS
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const kHttpPort = process.env.PORT || 1337;
const kDataFetcher = new DataFetcher();

const httpServer = polka();
const wsServer = new WebSocketServer({ port: 1338 });

httpServer.use(
  sirv(path.join(__dirname, "public"), { dev: true })
);

httpServer.get("/health", (req, res) => {
  send(res, 200, {
    uptime: process.uptime()
  });
});

let socketClient = null;

wsServer.on("connection", (socket) => {
  socketClient = socket;

  socket.on("message", async(data) => {
    const { orgName } = JSON.parse(data);

    if (orgName) {
      try {
        const data = await kDataFetcher.getData(orgName);
        const logo = data.logo;
        const html = template.render(data);

        socket.send(JSON.stringify({
          orgName,
          logo,
          html
        }));
      }
      catch (error) {
        socket.send(JSON.stringify({ error: "Not found" }));
      }
    }
  });
});

httpServer.get("/", async(req, res) => {
  try {
    const data = await kDataFetcher.getData();
    const orgName = data.orgName;
    const logo = data.logo;
    const html = template.render(data);

    res.end(html);

    // We need to wait for the socket to be ready
    const sendSocket = setInterval(() => {
      if (!socketClient) {
        return;
      }

      socketClient.send(JSON.stringify({
        orgName,
        logo,
        html
      }));

      clearInterval(sendSocket);
    }, 100);
  }
  catch (error) {
    send(res, 500, error.message);
  }
});

httpServer.listen(
  kHttpPort,
  () => console.log(`HTTP Server listening on http://localhost:${kHttpPort}`)
);
