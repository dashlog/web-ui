// Import Internal Dependencies
import { logger } from "../logger.js";

export default class Router {
  routes = new Map();
  stop = false;

  register(name, handler) {
    if (typeof handler !== "function") {
      logger.error(`[Router:register](route: ${name}, expected handler: function, given: ${typeof handler})`);
      throw new TypeError("handler must be a function");
    }
    if (this.routes.has(name)) {
      this.unRegister(name);
    }
    if (typeof name !== "string") {
      logger.error(`[Router:register] Failed to register route. Expected name to be a string, but got: ${typeof name}`);
      throw new TypeError("name must be a string");
    }

    this.routes.set(name, handler);
  }

  async handle(data) {
    if (typeof data === "object") {
      for (const key in data) {
        if (this.routes.has(key)) {
          if (this.stop) {
            return;
          }
          await this.routes.get(key)(data);
        }
      }
    }
  }
  unRegister(routeName) {
    this.routes.delete(routeName);
  }
}
