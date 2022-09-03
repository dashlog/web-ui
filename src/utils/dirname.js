// Import Node.js Dependencies
import { fileURLToPath } from "node:url";
import path from "node:path";

export function getDirNameFromUrl(url) {
  const __filename = fileURLToPath(url);

  return path.dirname(__filename);
}
