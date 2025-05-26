// Import Third-party Dependencies
import jwt from "jsonwebtoken";

export type AuthenticatedPayload = {};

export class Authenticator {
  static ExpirationTimeSeconds = 600;

  #password: string;

  constructor() {
    if (!process.env.UI_ADMIN_PASSWORD) {
      throw new Error("missing mandatory VAR 'UI_ADMIN_PASSWORD'");
    }
    this.#password = process.env.UI_ADMIN_PASSWORD;
  }

  verifyToken(
    userPassword: string,
    token: string
  ): void {
    if (!userPassword && !token) {
      throw new Error("Missing userPassword or token");
    }

    if (userPassword && userPassword !== this.#password) {
      throw new Error("Invalid password");
    }

    if (token && !userPassword) {
      try {
        jwt.verify(token, this.#password);
      }
      catch (error) {
        throw new Error("Invalid token", { cause: error });
      }
    }
  }

  signToken(): AuthenticatedPayload {
    return jwt.sign(
      {},
      this.#password,
      { expiresIn: Authenticator.ExpirationTimeSeconds }
    );
  }
}
