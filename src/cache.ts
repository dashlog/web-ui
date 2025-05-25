// Import Node.js Dependencies
import fs from "node:fs";
import path from "node:path";

// Import Third-party Dependencies
import type { DashlogOrganization } from "@dashlog/core";

// Import Internal Dependencies
import { logger } from "./logger.js";
import * as template from "./template.js";

export type DashlogOrganizationCached = DashlogOrganization<any> & {
  orgName: string;
  lastUpdate: string;
};

// CONSTANTS
export const CACHE_PATH = path.join(process.cwd(), "/data");
const kOrgsLocation = path.join(CACHE_PATH, "orgs.json");

export function getOrgList(): string[] {
  return JSON.parse(
    fs.readFileSync(kOrgsLocation, "utf-8")
  );
}

export function getOrg(
  orgName: string
): DashlogOrganizationCached {
  return JSON.parse(
    fs.readFileSync(path.join(CACHE_PATH, `${orgName}.json`), "utf-8")
  );
}

export function getAll(): (DashlogOrganizationCached & { main: string; header: string; })[] {
  const orgs = getOrgList();

  return orgs.map((orginizationName) => {
    const org = getOrg(orginizationName);

    return {
      ...org,
      main: template.renderStatusboard(org),
      header: template.renderHeader(org)
    };
  });
}

export function saveOne(
  orgName: string,
  data: DashlogOrganizationCached
) {
  fs.writeFileSync(
    path.join(CACHE_PATH, `${orgName}.json`),
    JSON.stringify(data)
  );

  updateAll(orgName);
}

export function updateAll(
  orgName: string
): void {
  try {
    const orgs = getOrgList();
    if (orgs.find((org) => org.toLowerCase() === orgName.toLowerCase())) {
      return;
    }

    orgs.push(orgName);
    fs.writeFileSync(kOrgsLocation, JSON.stringify(orgs));
  }
  catch (error: any) {
    // writeFileSync threw because the file doesn't exists.
    logger.error(`Failed to update orgs.json: ${error.message}`);
    fs.writeFileSync(kOrgsLocation, JSON.stringify([orgName]));
  }
}

export function removeOne(
  orgName: string
): void {
  try {
    const orgs = getOrgList()
      .filter((org) => org.toLowerCase() !== orgName.toLowerCase());

    fs.writeFileSync(kOrgsLocation, JSON.stringify(orgs));
    fs.rmSync(path.join(CACHE_PATH, `${orgName}.json`));
  }
  catch (error: any) {
    // Do nothing, file doesn't exists.
    logger.error(`Failed to update orgs.json: ${error.message}`);
  }
}
