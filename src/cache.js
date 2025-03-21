// Import Node.js Dependencies
import fs from "node:fs";
import path from "node:path";

// Import Internal Dependencies
import { logger } from "../logger.js";
import * as template from "./template.js";

// CONSTANTS
export const CACHE_PATH = path.join(process.cwd(), "/data");

// Ensure CACHE_PATH exists
if (!fs.existsSync(CACHE_PATH)) {
  fs.mkdirSync(CACHE_PATH, { recursive: true });
}

export function getOrg(orgName) {
  const jsonFile = typeof orgName === "string" ? orgName : "orgs";
  const filePath = path.join(CACHE_PATH, `${jsonFile}.json`);

  if (!fs.existsSync(filePath)) {
    logger.warn(`[Cache:getOrg] Cache file not found: ${jsonFile}. Returning empty object.`);
    return {};
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (error) {
    logger.error(`[Cache:getOrg] Failed to parse JSON file ${jsonFile}: ${error.message}`);
    return {};
  }
}

export function getAll() {
  const orgs = getOrg() || [];

  return orgs.map((organizationName) => {
    const org = getOrg(organizationName);
    return {
      ...org,
      main: template.renderStatusboard(org),
      header: template.renderHeader(org)
    };
  });
}

export function saveOne(orgName, data) {
  try {
    fs.writeFileSync(path.join(CACHE_PATH, `${orgName}.json`), JSON.stringify(data, null, 2));
    updateAll(orgName);
  } catch (error) {
    logger.error(`[Cache:saveOne] Failed to save cache for ${orgName}: ${error.message}`);
  }
}

export function updateAll(orgName) {
  try {
    const orgs = getOrg() || [];
    if (!orgs.includes(orgName.toLowerCase())) {
      orgs.push(orgName);
      fs.writeFileSync(path.join(CACHE_PATH, "orgs.json"), JSON.stringify(orgs, null, 2));
    }
  } catch (error) {
    logger.error(`[Cache:updateAll] Failed to update orgs.json: ${error.message}`);
    fs.writeFileSync(path.join(CACHE_PATH, "orgs.json"), JSON.stringify([orgName], null, 2));
  }
}

export function removeOne(orgName) {
  try {
    const orgs = getOrg().filter((org) => org.toLowerCase() !== orgName.toLowerCase());
    fs.writeFileSync(path.join(CACHE_PATH, "orgs.json"), JSON.stringify(orgs, null, 2));

    const orgFile = path.join(CACHE_PATH, `${orgName}.json`);
    if (fs.existsSync(orgFile)) {
      fs.rmSync(orgFile);
    }
  } catch (error) {
    logger.error(`[Cache:removeOne] Failed to remove ${orgName}: ${error.message}`);
  }
}
