export default class Router {
  routes = new Map();
  stop = false;

  register(name, handler) {
    if (typeof handler !== "function") {
      throw new TypeError("handler must be a function");
    }
    if (this.routes.has(name)) {
      this.unRegister(name)
    }
    if (typeof name !== "string") {
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
