import jwt from "jsonwebtoken";

export function authenticate(password, token) {
  if (!password && !token) {
    throw new Error("Missing password or token");
  }

  if (password) {
    if (password !== process.env.UI_ADMIN_PASSWORD) {
      throw new Error("Invalid password");
    }
  }

  if (token && !password) {
    try {
      jwt.verify(token, process.env.UI_ADMIN_PASSWORD);
    }
    catch (error) {
      throw new Error("Invalid token");
    }
  }
}
