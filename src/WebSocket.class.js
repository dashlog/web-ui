import DataFetcher from "./DataFetcher.class.js";
import Router from "./Router.class.js";
import { WebSocketServer } from "ws";
import { logger } from "../logger.js";

export default class WSS extends WebSocketServer {
  constructor(options) {
    super(options);
    this.dataFetcher = new DataFetcher();
    this.router = new Router();

    this.on("connection", async (socket) => {
      this.registerRoutes(socket);
      await this.handleConnection(socket);

      socket.on("message", (data) => {
        this.router.stop = false;
        this.handleMessage(data, socket);
      });

      socket.on("close", () => {
        logger.info("WebSocket connection closed");
      });
    });
  }

  async handleConnection(socket) {
    try {
      const data = await this.dataFetcher.getData();
      socket.send(JSON.stringify(data));
    } catch (error) {
      logger.error(`WebSocket error: ${error.message}`);
      socket.send(JSON.stringify({ error: "Failed to fetch data" }));
    }
  }

  registerRoutes(socket) {
    this.router.register("activeRepo", async ({ repoName }) => {
      try {
        const data = await this.dataFetcher.getData(repoName);
        socket.send(JSON.stringify(data));
      } catch (error) {
        logger.error(`Error fetching repo: ${error.message}`);
        socket.send(JSON.stringify({ error: "Repo not found" }));
      }
      this.router.stop = true;
    });
  }

  handleMessage(data, socket) {
    try {
      const parsedData = JSON.parse(data);
      if (!parsedData || typeof parsedData !== "object") {
        throw new Error("Invalid message format");
      }
      this.router.handle(parsedData);
    } catch (error) {
      logger.error(`[WebSocket] Failed to process message: ${error.message}`);
      socket.send(JSON.stringify({ error: "Invalid message format" }));
    }
  }
}
