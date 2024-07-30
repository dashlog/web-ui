// Import Node.js Dependencies
import fs from "node:fs";
import path from "node:path";

// Import Internal Dependencies
import logger from "../logger.js";
import * as template from "./template.js";

// CONSTANTS
export const CACHE_PATH = path.join(process.cwd(), "/data");

export function getOrg(orgName) {
  const jsonFile = typeof orgName === "string" ? orgName : "orgs";

  return JSON.parse(fs.readFileSync(path.join(CACHE_PATH, `${jsonFile}.json`), "utf-8"));
}

export function getAll() {
  const orgs = getOrg();

  return orgs.map((orginizationName) => {
    const org = getOrg(orginizationName);

    return {
      ...org,
      main: template.renderStatusboard(org),
      header: template.renderHeader(org)
    };
  });
}

export function saveOne(orgName, data) {
  fs.writeFileSync(path.join(CACHE_PATH, `${orgName}.json`), JSON.stringify(data));

  updateAll(orgName);
}

export function updateAll(orgName) {
  try {
    const orgs = getOrg();
    if (orgs.find((org) => org.toLowerCase() === orgName.toLowerCase())) {
      return;
    }

    orgs.push(orgName);
    fs.writeFileSync(path.join(CACHE_PATH, "orgs.json"), JSON.stringify(orgs));
  }
  catch (error) {
    // writeFileSync threw because the file doesn't exists.
    logger.error(`Failed to update orgs.json: ${error.message}`);
    fs.writeFileSync(path.join(CACHE_PATH, "orgs.json"), JSON.stringify([orgName]));
  }
}

export function removeOne(orgName) {
  try {
    const orgs = getOrg().filter((org) => org.toLowerCase() !== orgName.toLowerCase());

    fs.writeFileSync(path.join(CACHE_PATH, "orgs.json"), JSON.stringify(orgs));
    fs.rmSync(path.join(CACHE_PATH, `${orgName}.json`));
  }
  catch (error) {
    // Do nothing, file doesn't exists.
    logger.error(`Failed to update orgs.json: ${error.message}`);
  }
}
