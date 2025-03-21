// Import Third-party Dependencies
import jwt from "jsonwebtoken";

// Import Internal Dependencies
import { logger } from "../logger.js";

// CONSTANTS
const kTokenExpirationTimeSeconds = 600;
const JWT_SECRET = process.env.JWT_SECRET || "your-very-strong-random-secret";
const ADMIN_PASSWORD = process.env.UI_ADMIN_PASSWORD;

export function verify(password, token) {
  if (!password && !token) {
    logger.error("[Auth:verify] Verification failed: Missing password or token.");
    throw new Error("Missing password or token");
  }

  if (password) {
    if (password !== ADMIN_PASSWORD) {
      logger.error("[Auth:verify] Verification failed: Invalid password.");
      throw new Error("Invalid password");
    }
  }

  if (token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      logger.error(`[Auth:verify] Verification failed: Invalid token. Error: ${error.message}`);
      throw new Error("Invalid token");
    }
  }
}

export function signOne(payload = {}) {
  try {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: kTokenExpirationTimeSeconds });
  } catch (error) {
    logger.error(`[Auth:signOne] Error signing token: ${error.message}`);
    throw new Error("Failed to sign token");
  }
}
