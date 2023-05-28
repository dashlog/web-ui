// Import Node.js Dependencies
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Import Third-party Dependencies
import ejs from "ejs";

// Import Internal Dependencies
import * as cache from "./cache.js";

// CONSTANTS
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const kViewsDir = path.join(__dirname, "..", "views");

export function renderStatusboard(data = {}) {
  const rawHtmlStr = fs.readFileSync(
    path.join(kViewsDir, "statusboard.ejs"), "utf-8"
  );

  return ejs.compile(rawHtmlStr)(data);
}

export function renderHeader(data = {}) {
  const rawHtmlStr = fs.readFileSync(
    path.join(kViewsDir, "header.ejs"), "utf-8"
  );

  return ejs.compile(rawHtmlStr)(data);
}

export async function renderAllOrganizations() {
  const orgs = await cache.getOrg();

  return Promise.all(
    orgs.map(async(orginizationName) => {
      const org = await cache.getOrg(orginizationName);

      return {
        ...org,
        main: renderStatusboard(org),
        header: renderHeader(org)
      };
    })
  )
}
