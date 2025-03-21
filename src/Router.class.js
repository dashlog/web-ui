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
    if (typeof name !== "string") {
      logger.error(`[Router:register] Failed to register route. Expected name to be a string, but got: ${typeof name}`);
      throw new TypeError("name must be a string");
    }

    if (this.routes.has(name)) {
      logger.warn(`[Router:register] Route '${name}' already exists. Overwriting...`);
      this.unRegister(name);
    }

    this.routes.set(name, handler);
  }

  async handle(data) {
    if (!data || typeof data !== "object") {
      logger.error(`[Router:handle] Invalid data received: ${JSON.stringify(data)}`);
      return;
    }

    for (const key in data) {
      if (this.routes.has(key)) {
        if (this.stop) return;
        try {
          await this.routes.get(key)(data);
        } catch (error) {
          logger.error(`[Router:handle] Error executing route '${key}': ${error.message}`);
        }
      }
    }
  }

  unRegister(routeName) {
    if (!routeName || typeof routeName !== "string") {
      logger.error(`[Router:unRegister] Invalid route name: ${routeName}`);
      return;
    }

    if (this.routes.has(routeName)) {
      this.routes.delete(routeName);
      logger.info(`[Router:unRegister] Successfully removed route: ${routeName}`);
    } else {
      logger.warn(`[Router:unRegister] Attempted to remove non-existent route: ${routeName}`);
    }
  }

  clearRoutes() {
    this.routes.clear();
    logger.info("[Router:clearRoutes] All routes have been cleared.");
  }
}
