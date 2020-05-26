"use strict";

require("dotenv").config();
require("make-promises-safe");

// Require Node.js Dependencies
const { readFileSync } = require("fs");
const { join } = require("path");

// Require Third-party Dependencies
const polka = require("polka");
const send = require("@polka/send");
const ejs = require("ejs");
const sirv = require("sirv");

// Require Internal Dependencies
const { fetchOrgMetadata } = require("./src/utils");

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
httpServer.use(sirv(join(__dirname, "public"), { dev: true }));

httpServer.get("/meta", (req, res) => {
    send(res, 200, { uptime: process.uptime() });
});

httpServer.get("/", async(req, res) => {
    try {
        const kHomeTemplate = ejs.compile(readFileSync(join(__dirname, "views", "home.ejs"), { encoding: "utf8" }));

        if (projects === null) {
            ({ projects, logo } = await fetchOrgMetadata());
        }
        res.end(kHomeTemplate({
            orgName: process.env.GITHUB_ORG_NAME,
            lastUpdate: lastUpdate.toUTCString(),
            logo, projects
        }));
    }
    catch (error) {
        console.error(error);
        send(res, 500, error.message);
    }
});

const httpPort = process.env.PORT || 1337;
httpServer.listen(httpPort, () => console.log(`HTTP Server listening on port: ${httpPort}`));

