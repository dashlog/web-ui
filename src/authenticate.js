
// Import Third-party Dependencies
import jwt from "jsonwebtoken";

// Import Internal Dependencies
import { logger } from "../logger.js";

// CONSTANTS
const kTokenExpirationTimeSeconds = 600;

export function verify(password, token) {
  if (!password && !token) {
    logger.error(`[Auth:verify] Verification failed: Missing password or token. (password: ${password}, token: ${token})`);
    throw new Error("Missing password or token");
  }

  if (password && password !== process.env.UI_ADMIN_PASSWORD) {
    logger.error(
      "[Auth:verify] Verification failed: Invalid password. " +
      `(attemptedPassword: ${password}, expectedPassword: ${process.env.UI_ADMIN_PASSWORD})`
    );
    throw new Error("Invalid password");
  }

  if (token && !password) {
    try {
      jwt.verify(token, process.env.UI_ADMIN_PASSWORD);
    }
    catch (error) {
      logger.error(`[Auth:verify] Verification failed: Invalid token. (token: ${token}, error: ${error.message})`);
      throw new Error("Invalid token");
    }
  }
}

export function signOne() {
  return jwt.sign(
    {},
    process.env.UI_ADMIN_PASSWORD,
    { expiresIn: kTokenExpirationTimeSeconds }
  );
}
