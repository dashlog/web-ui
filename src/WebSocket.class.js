// Import Third-party Dependencies
import { WebSocketServer } from "ws";

// Import Internal Dependencies
import DataFetcher from "./DataFetcher.class.js";
import * as template from "./template.js";
import * as auth from "./authenticate.js";
import * as orgCache from "./cache.js";
import Router from "./Router.class.js";

export default class WSS extends WebSocketServer {
  constructor(options) {
    super(options);
    this.DataFetcher = new DataFetcher();
    this.router = new Router();

    this.on("connection", async(socket) => {
      this.registerRoutes(socket);

      await this.handleConnection(socket);

      socket.on("message", (data) => {
        this.router.stop = false;
        this.handleMessage(data, socket);
      });
    });
  }

  async handleConnection(socket) {
    try {
      const orgs = await template.renderAllOrganizations();
      socket.send(JSON.stringify({ orgs }));
    }
    catch {
      // do nothing, cache is just empty
    }

    const data = await this.getOrgData();
    socket.send(JSON.stringify(data));
  }

  registerRoutes(socket) {
    this.router.register("removeOrg", async({ removeOrg, password, token }) => {
      try {
        auth.verify(password, token);
      }
      catch (error) {
        socket.send(JSON.stringify({ error: error.message }));

        this.router.stop = true;
      }

      orgCache.removeOne(removeOrg);

      if (this.DataFetcher.orgName === removeOrg) {
        this.DataFetcher.orgName = process.env.GITHUB_ORG_NAME;
      }

      socket.send(JSON.stringify({ removeOrg }));

      this.router.stop = true;
    });

    this.router.register("activeOrg", async({ activeOrg }) => {
      try {
        const data = await this.getOrgData(activeOrg);
        socket.send(JSON.stringify(data));
      }
      catch (error) {
        socket.send(JSON.stringify({ error: "Not found" }));
      }

      this.router.stop = true;
    });
  }

  async handleMessage(data, socket) {
    const { orgName, password, token } = JSON.parse(data);

    this.router.handle(JSON.parse(data));

    if (!orgName) {
      return;
    }

    try {
      auth.verify(password, token);
    }
    catch (error) {
      socket.send(JSON.stringify({ error: error.message }));

      return;
    }

    try {
      const data = await this.getOrgData(orgName);

      socket.send(JSON.stringify({
        ...data, token: auth.signOne()
      }));
    }
    catch (error) {
      socket.send(JSON.stringify({ error: "Not found" }));
    }
  }

  async getOrgData(orgName) {
    const data = await this.DataFetcher.getData(orgName);
    const logo = data.logo;
    const lastUpdate = data.lastUpdate;
    const main = template.renderStatusboard(data);
    const header = template.renderHeader(data);

    return {
      orgName: orgName ?? data.orgName,
      logo,
      main,
      header,
      lastUpdate
    };
  }
}
