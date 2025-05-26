// Import Third-party Dependencies
import {
  WebSocketServer,
  type ServerOptions,
  type WebSocket
} from "ws";
import type { FastifyBaseLogger } from "fastify";

// Import Internal Dependencies
import DataFetcher from "../DataFetcher.class.js";
import Router from "./Router.class.js";
import { OrganizationCache } from "../cache.js";
import { Authenticator } from "./Authenticator.class.js";
import * as template from "../template.js";

export default class WSS extends WebSocketServer {
  public router: Router;
  public fetcher: DataFetcher;
  public orgCache: OrganizationCache;
  public authenticator = new Authenticator();
  #logger: FastifyBaseLogger;

  constructor(
    options: ServerOptions,
    logger: FastifyBaseLogger
  ) {
    super(options);

    this.#logger = logger;
    this.router = new Router(logger);
    this.orgCache = new OrganizationCache(logger);
    this.fetcher = new DataFetcher(logger, this.orgCache);

    this.on("connection", async(socket) => {
      this.registerRoutes(socket);

      await this.handleConnection(socket);

      socket.on("message", (data) => {
        this.router.stop = false;
        this.handleMessage(data, socket);
      });
    });
  }

  async handleConnection(
    socket: WebSocket
  ) {
    try {
      const orgs = await this.fetcher.renderAllOrganizations();
      socket.send(JSON.stringify({ orgs }));
    }
    catch {
      // do nothing, cache is just empty
    }

    const data = await this.getOrgData();
    socket.send(JSON.stringify(data));
  }

  registerRoutes(
    socket: WebSocket
  ) {
    this.router.register("removeOrg", async(data) => {
      const { removeOrg, password, token } = data;
      try {
        this.authenticator.verifyToken(password, token);
      }
      catch (error: any) {
        this.#logger.error(
          `[WSS:registerRoutes:removeOrg] Error verifying credentials for removeOrg: ${removeOrg}. Error: ${error.message}`
        );
        socket.send(JSON.stringify({ error: error.message }));

        this.router.stop = true;
      }

      this.orgCache.remove(removeOrg);

      if (this.fetcher.orgName === removeOrg) {
        this.fetcher.orgName = process.env.GITHUB_ORG_NAME!;
      }

      socket.send(JSON.stringify({ removeOrg }));

      this.router.stop = true;
    });

    this.router.register("activeOrg", async(data) => {
      const { activeOrg } = data;
      try {
        const data = await this.getOrgData(activeOrg);
        socket.send(JSON.stringify(data));
      }
      catch (error: any) {
        this.#logger.error(`[WSS:registerRoutes:activeOrg] Error activating organization: ${activeOrg}. Error: ${error.message}`);
        socket.send(JSON.stringify({ error: "Not found" }));
      }

      this.router.stop = true;
    });
  }

  async handleMessage(
    data: WebSocket.RawData,
    socket: WebSocket
  ) {
    const parsedData = JSON.parse(data.toString());
    const { orgName, password, token } = parsedData;

    this.router.handle(parsedData);

    if (!orgName) {
      return;
    }

    try {
      this.authenticator.verifyToken(password, token);
    }
    catch (error: any) {
      this.#logger.error(`[WSS:handleMessage] Error verifying credentials for organization: ${orgName}. Error: ${error.message}`);
      socket.send(JSON.stringify({ error: error.message }));

      return;
    }

    try {
      const data = await this.getOrgData(orgName);

      socket.send(JSON.stringify({
        ...data, token: this.authenticator.signToken()
      }));
    }
    catch (error: any) {
      this.#logger.error(`[WSS:handleMessage] Not found organization data for: ${orgName}. Error: ${error.message}`);
      socket.send(JSON.stringify({ error: "Not found" }));
    }
  }

  async getOrgData(
    orgName?: string
  ) {
    const data = await this.fetcher.getData(orgName);
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
