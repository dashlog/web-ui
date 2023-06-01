// Import Third-party Dependencies
import jwt from "jsonwebtoken";

// CONSTANTS
const kTokenExpirationTimeSeconds = 600;

export function verify(password, token) {
  if (!password && !token) {
    throw new Error("Missing password or token");
  }

  if (password && password !== process.env.UI_ADMIN_PASSWORD) {
    throw new Error("Invalid password");
  }

  if (token && !password) {
    try {
      jwt.verify(token, process.env.UI_ADMIN_PASSWORD);
    }
    catch {
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
