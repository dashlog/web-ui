// Import Node.js Dependencies
import { fileURLToPath } from "node:url";
import path from "node:path";

// Import Third-party Dependencies
import polka from "polka";
import send from "@polka/send";
import sirv from "sirv";
import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";

// Import Internal Dependencies
import DataFetcher from "./src/DataFetcher.class.js";
import * as template from "./src/template.js";

// CONSTANTS
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const kHttpPort = process.env.PORT || 1337;
const kDataFetcher = new DataFetcher();
const kTokenExpirationTime = 600000;

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


wsServer.on("connection", async(socket) => {
  const data = await kDataFetcher.getData();
  const orgName = data.orgName;
  const logo = data.logo;
  const main = template.renderStatusboard(data);
  const header = template.renderHeader(data);
  const token = jwt.sign({}, process.env.UI_ADMIN_PASSWORD, { expiresIn: kTokenExpirationTime });

  socket.send(JSON.stringify({
    orgName,
    logo,
    main,
    header
  }));

  socket.on("message", async(data) => {
    const { orgName, password, token } = JSON.parse(data);

    if (!orgName) {
      return;
    }

    if (!password && !token) {
      socket.send(JSON.stringify({ error: "Missing password or token" }));

      return;
    }

    if (password) {
      if (password !== process.env.UI_ADMIN_PASSWORD) {
        socket.send(JSON.stringify({ error: "Invalid password" }));

        return;
      }
    }

    if (token && !password) {
      try {
        const decoded = jwt.verify(token, process.env.UI_ADMIN_PASSWORD);
      }
      catch (error) {
        socket.send(JSON.stringify({ error: "Invalid token" }));

        return;
      }
    }

    try {
      const data = await kDataFetcher.getData(orgName);
      const logo = data.logo;
      const main = template.renderStatusboard(data);
      const header = template.renderHeader(data);
      const token = jwt.sign({}, process.env.UI_ADMIN_PASSWORD, { expiresIn: process.env.kTokenExpirationTime });

      socket.send(JSON.stringify({
        orgName,
        logo,
        main,
        header,
        token
      }));
    }
    catch (error) {
      socket.send(JSON.stringify({ error: "Not found" }));
    }
  });
});

httpServer.listen(
  kHttpPort,
  () => console.log(`HTTP Server listening on http://localhost:${kHttpPort}`)
);
