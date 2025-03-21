// Import Node.js Dependencies
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Import Third-party Dependencies
import ejs from "ejs";

// Import Internal Dependencies
import DataFetcher from "./DataFetcher.class.js";

// CONSTANTS
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const kViewsDir = path.join(__dirname, "..", "views");

const dataFetcher = new DataFetcher();

export function renderStatusboard(data = {}) {
  try {
    const rawHtmlStr = fs.readFileSync(
      path.join(kViewsDir, "statusboard.ejs"), "utf-8"
    );
    return ejs.compile(rawHtmlStr)(data);
  } catch (error) {
    console.error(`[Template:renderStatusboard] Failed to render statusboard: ${error.message}`);
    return "<p>Error rendering statusboard</p>";
  }
}

export function renderHeader(data = {}) {
  try {
    const rawHtmlStr = fs.readFileSync(
      path.join(kViewsDir, "header.ejs"), "utf-8"
    );
    return ejs.compile(rawHtmlStr)(data);
  } catch (error) {
    console.error(`[Template:renderHeader] Failed to render header: ${error.message}`);
    return "<p>Error rendering header</p>";
  }
}

export async function renderAllOrganizations() {
  try {
    const data = await dataFetcher.getData();
    return data.repos.map((repo) => ({
      ...repo,
      main: renderStatusboard(repo),
      header: renderHeader(repo)
    }));
  } catch (error) {
    console.error(`[Template:renderAllOrganizations] Failed to render organizations: ${error.message}`);
    return [];
  }
}
