// Import Node.js Dependencies
import { fileURLToPath } from "node:url";
import path from "node:path";

// Import Third-party Dependencies
import polka from "polka";
import send from "@polka/send";
import sirv from "sirv";
import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import cacache from "cacache";

// Import Internal Dependencies
import { authenticate } from "./src/authenticate.js";
import { CACHE_PATH } from "./src/constants.js";
import DataFetcher, { removeOrgFromCache } from "./src/DataFetcher.class.js";
import * as template from "./src/template.js";

// CONSTANTS
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const kHttpPort = process.env.PORT || 1337;
const kDataFetcher = new DataFetcher();
const kTokenExpirationTimeSeconds = 600;

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
  const lastUpdate = data.lastUpdate;
  const main = template.renderStatusboard(data);
  const header = template.renderHeader(data);

  try {
    const { data } = await cacache.get(CACHE_PATH, "orgs");
    const orgs = JSON.parse(data.toString());
    const orgsData = [];

    for (const org of orgs) {
      const { data } = await cacache.get(CACHE_PATH, org);
      const orgData = JSON.parse(data.toString());
      const main = template.renderStatusboard(orgData);
      const header = template.renderHeader(orgData);
      orgsData.push({ ...orgData, main, header });
    }

    socket.send(JSON.stringify({ orgs: orgsData }));
  }
  catch {
    // do nothing, cache is just empty
  }

  try {
    const { data } = await cacache.get(CACHE_PATH, "orgs");
    const orgs = JSON.parse(data.toString());
    const orgsData = [];

    for (const org of orgs) {
      const { data } = await cacache.get(CACHE_PATH, org);
      const orgData = JSON.parse(data.toString());
      const main = template.renderStatusboard(orgData);
      const header = template.renderHeader(orgData);
      orgsData.push({ ...orgData, main, header });
    }

    socket.send(JSON.stringify({ orgs: orgsData }));
  }
  catch {
    // do nothing, cache is just empty
  }

  socket.send(JSON.stringify({
    orgName,
    logo,
    main,
    header,
    lastUpdate
  }));

  socket.on("message", async(data) => {
    const { activeOrg, orgName, removeOrg, password, token } = JSON.parse(data);

    if (removeOrg) {
      try {
        authenticate(password, token);
      }
      catch (error) {
        socket.send(JSON.stringify({ error: error.message }));

        return;
      }

      await removeOrgFromCache(removeOrg);

      if (kDataFetcher.orgName === removeOrg) {
        kDataFetcher.orgName = process.env.GITHUB_ORG_NAME;
      }

      socket.send(JSON.stringify({ removeOrg }));

      return;
    }

    if (activeOrg) {
      try {
        const data = await kDataFetcher.getData(activeOrg);
        const logo = data.logo;
        const lastUpdate = data.lastUpdate;
        const main = template.renderStatusboard(data);
        const header = template.renderHeader(data);
        socket.send(JSON.stringify({
          orgName: activeOrg,
          logo,
          main,
          header,
          lastUpdate
        }));
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
      authenticate(password, token);
    }
    catch (error) {
      socket.send(JSON.stringify({ error: error.message }));

      return;
    }

    try {
      const data = await kDataFetcher.getData(orgName);
      const logo = data.logo;
      const lastUpdate = data.lastUpdate;
      const main = template.renderStatusboard(data);
      const header = template.renderHeader(data);
      const token = jwt.sign({}, process.env.UI_ADMIN_PASSWORD, { expiresIn: kTokenExpirationTimeSeconds });

      socket.send(JSON.stringify({
        orgName,
        logo,
        main,
        header,
        token,
        lastUpdate
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
