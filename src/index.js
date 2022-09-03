import "make-promises-safe";
import dotenv from "dotenv";
dotenv.config();

// Import Node.js Dependencies
import { readFileSync } from "node:fs";
import path from "node:path";

// Import Third-party Dependencies
import polka from "polka";
import send from "@polka/send";
import ejs from "ejs";
import sirv from "sirv";

// Import Internal Dependencies
import { fetchOrgMetadata } from "./utils.js";

// Vars
let projects = null;
let logo = "";
let lastUpdate = new Date();

setInterval(async() => {
  try {
    ({ projects, logo } = await fetchOrgMetadata());
    lastUpdate = new Date();
  }
  catch (error) {
    console.error(error);
  }
}, 10 * 60_000);

// Create http Server
const httpServer = polka();
httpServer.use(sirv(path.join(__dirname, "public"), { dev: true }));

httpServer.get("/meta", (req, res) => {
  send(res, 200, { uptime: process.uptime() });
});

httpServer.get("/", async(req, res) => {
  try {
    const kHomeTemplate = ejs.compile(readFileSync(path.join(__dirname, "views", "home.ejs"), { encoding: "utf8" }));

    if (projects === null) {
      ({ projects, logo } = await fetchOrgMetadata());
    }

    // eslint-disable-next-line new-cap
    const formatDate = Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric"
    }).format(new Date(lastUpdate));
    res.end(kHomeTemplate({
      orgName: process.env.GITHUB_ORG_NAME,
      lastUpdate: formatDate,
      logo,
      projects
    }));
  }
  catch (error) {
    console.error(error);
    send(res, 500, error.message);
  }
});

const httpPort = process.env.PORT || 1337;
httpServer.listen(httpPort, () => console.log(`HTTP Server listening on port: ${httpPort}`));

