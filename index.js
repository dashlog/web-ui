// Import Node.js Dependencies
import { fileURLToPath } from "node:url";
import path from "node:path";

// Import Third-party Dependencies
import polka from "polka";
import send from "@polka/send";
import sirv from "sirv";
import { WebSocketServer } from "ws";

// Import Internal Dependencies
import * as auth from "./src/authenticate.js";
import * as orgCache from "./src/cache.js";
import * as template from "./src/template.js";
import DataFetcher from "./src/DataFetcher.class.js";

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

wsServer.on("connection", async(socket) => {
  try {
    const orgs = await template.renderAllOrganizations();
    socket.send(JSON.stringify({ orgs }));
  }
  catch {
    // do nothing, cache is just empty
  }

  const data = await getOrgData();
  socket.send(JSON.stringify(data));

  socket.on("message", async(data) => {
    const { activeOrg, orgName, removeOrg, password, token } = JSON.parse(data);

    if (removeOrg) {
      try {
        auth.verify(password, token);
      }
      catch (error) {
        socket.send(JSON.stringify({ error: error.message }));

        return;
      }

      orgCache.removeOne(removeOrg);

      if (kDataFetcher.orgName === removeOrg) {
        kDataFetcher.orgName = process.env.GITHUB_ORG_NAME;
      }

      socket.send(JSON.stringify({ removeOrg }));

      return;
    }

    if (activeOrg) {
      try {
        const data = await getOrgData(activeOrg);
        socket.send(JSON.stringify(data));
      }
      catch (error) {
        socket.send(JSON.stringify({ error: "Not found" }));
      }

      return;
    }

    if (!orgName) {
      return;
    }

    try {
      auth.verify(password, token);
    }
    catch (error) {
      socket.send(JSON.stringify({ error: error.message }));

      return;
    }

    try {
      const data = await getOrgData(orgName);

      socket.send(JSON.stringify({
        ...data, token: auth.signOne()
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

async function getOrgData(orgName) {
  const data = await kDataFetcher.getData(orgName);
  const logo = data.logo;
  const lastUpdate = data.lastUpdate;
  const main = template.renderStatusboard(data);
  const header = template.renderHeader(data);

  return {
    orgName: orgName ?? data.orgName,
    logo,
    main,
    header,
    lastUpdate
  };
}
