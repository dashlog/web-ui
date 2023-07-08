// Import Third-party Dependencies
import { WebSocketServer } from "ws";

// Import Internal Dependencies
import DataFetcher from "./DataFetcher.class.js";
import * as template from "./template.js";
import * as auth from "./authenticate.js";
import * as orgCache from "./src/cache.js";

export default class WSS extends WebSocketServer {
  constructor(options) {
    super(options);
    this.connections = new Set();
    this.kDataFetcher = new DataFetcher();

    this.on("connection", (socket) => {
      this.connections.add(socket);

      this.handleConnection(socket);

      socket.on("message", (data) => {
        this.handleMessage(data, socket);
      });
      socket.on("close", () => {
        this.connections.delete(socket);
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

  async handleMessage(data, socket) {
    const { activeOrg, orgName, removeOrg, password, token } = JSON.parse(data);

    if (removeOrg) {
      try {
        auth.verify(password, token);
      }
      catch (error) {
        socket.send(JSON.stringify({ error: error.message }));

        return;
      }

      orgCache.removeOne(removeOrg);

      if (this.kDataFetcher.orgName === removeOrg) {
        this.kDataFetcher.orgName = process.env.GITHUB_ORG_NAME;
      }

      socket.send(JSON.stringify({ removeOrg }));

      return;
    }

    if (activeOrg) {
      try {
        const data = await this.getOrgData(activeOrg);
        socket.send(JSON.stringify(data));
      }
      catch (error) {
        socket.send(JSON.stringify({ error: "Not found" }));
      }

      return;
    }

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
    const data = await this.kDataFetcher.getData(orgName);
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
