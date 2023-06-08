// Import Node.js Dependencies
import fs from "node:fs";
import path from "node:path";

// Import Internal Dependencies
import * as template from "./template.js";

// CONSTANTS
const kCachePath = path.join(process.cwd(), "/data");

export function getOrg(orgName) {
  const jsonFile = typeof orgName === "string" ? orgName : "orgs";

  return JSON.parse(fs.readFileSync(path.join(kCachePath, `${jsonFile}.json`), "utf-8"));
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
  fs.writeFileSync(path.join(kCachePath, `${orgName}.json`), JSON.stringify(data));

  updateAll(orgName);
}

export function updateAll(orgName) {
  try {
    const orgs = getOrg();
    if (orgs.find((org) => org.toLowerCase() === orgName.toLowerCase())) {
      return;
    }

    orgs.push(orgName);
    fs.writeFileSync(path.join(kCachePath, "orgs.json"), JSON.stringify(orgs));
  }
  catch {
    // writeFileSync threw because the file doesn't exists.
    fs.writeFileSync(path.join(kCachePath, "orgs.json"), JSON.stringify([orgName]));
  }
}

export function removeOne(orgName) {
  try {
    const orgs = getOrg().filter((org) => org.toLowerCase() !== orgName.toLowerCase());

    fs.writeFileSync(path.join(kCachePath, "orgs.json"), JSON.stringify(orgs));
    fs.rmSync(path.join(kCachePath, `${orgName}.json`));
  }
  catch {
    // Do nothing, file doesn't exists.
  }
}
