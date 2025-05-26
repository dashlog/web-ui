// Import Third-party Dependencies
import type { FastifyBaseLogger } from "fastify";

export type RouterHandle = (data: any) => Promise<any>;

export default class Router {
  routes = new Map<string, RouterHandle>();
  stop = false;

  #logger: FastifyBaseLogger;

  constructor(
    logger: FastifyBaseLogger
  ) {
    this.#logger = logger;
  }

  register(
    name: string,
    handler: RouterHandle
  ): void {
    if (typeof handler !== "function") {
      this.#logger.error(
        `[Router:register](route: ${name}, expected handler: function, given: ${typeof handler})`
      );

      throw new TypeError("handler must be a function");
    }
    if (this.routes.has(name)) {
      this.unRegister(name);
    }
    if (typeof name !== "string") {
      this.#logger.error(
        `[Router:register] Failed to register route. Expected name to be a string, but got: ${typeof name}`
      );

      throw new TypeError("name must be a string");
    }

    this.routes.set(name, handler);
  }

  async handle(
    data: unknown
  ) {
    if (typeof data !== "object") {
      return;
    }

    for (const key in data) {
      if (this.routes.has(key)) {
        if (this.stop) {
          return;
        }
        await this.routes.get(key)!(data);
      }
    }
  }

  unRegister(
    routeName: string
  ): void {
    this.routes.delete(routeName);
  }
}
