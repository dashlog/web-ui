// Import Node.js Dependencies
import fs from "node:fs";
import path from "node:path";

// Import Third-party Dependencies
import ejs from "ejs";

// CONSTANTS
const kViewsDir = path.join(import.meta.dirname, "..", "views");

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
