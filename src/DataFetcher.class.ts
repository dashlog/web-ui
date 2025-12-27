// Import Third-party Dependencies
import {
  fetchOrgMetadata,
  type DashlogRepository
} from "@dashlog/core";
import type { FastifyBaseLogger } from "fastify";

// Import Internal Dependencies
import {
  OrganizationCache,
  type DashlogOrganizationCached
} from "./cache.ts";
import * as template from "./template.ts";

// CONSTANTS
const kDateFormatter = Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric"
});

export default class DataFetcher {
  #logger: FastifyBaseLogger;
  #orgCache: OrganizationCache;

  orgName = process.env.GITHUB_ORG_NAME!;
  lastUpdate: Date;
  logo = "";
  projects: DashlogRepository[] = [];
  timer: NodeJS.Timeout;

  constructor(
    logger: FastifyBaseLogger,
    orgCache: OrganizationCache
  ) {
    this.#logger = logger;
    this.#orgCache = orgCache;
    this.timer = setInterval(() => {
      this.#fetch().catch((error) => {
        this.#logger.error(`[DataFetcher:constructor] An error occurred during fetching: ${error.message}`);
      });
    }, 10 * 60_000);
  }

  close() {
    clearInterval(this.timer);
  }

  #getOrgFromCache() {
    const data = this.#orgCache.get(this.orgName);

    this.logo = data.logo;
    this.projects = data.projects;
    this.lastUpdate = new Date(data.lastUpdate);

    if (this.lastUpdate.getTime() < Date.now() - (10 * 60 * 60 * 1000)) {
      this.#logger.error(
        `[DataFetcher:getOrgFromCache] Cache is outdated for orgName: ${this.orgName}, lastUpdate: ${this.lastUpdate}`
      );
      throw new Error("Cache is outdated");
    }
  }

  async #fetch() {
    try {
      this.#getOrgFromCache();
    }
    catch {
      const result = await fetchOrgMetadata(this.orgName);

      this.logo = result.logo;
      this.projects = result.projects;
      this.lastUpdate = new Date();
    }

    this.#orgCache.update(this.orgName, {
      logo: this.logo,
      projects: this.projects,
      lastUpdate: this.lastUpdate.toJSON(),
      orgName: this.orgName
    });
  }

  async getData(
    orga?: string
  ): Promise<DashlogOrganizationCached & { main: string; header: string; }> {
    if (orga) {
      if (this.orgName !== orga) {
        this.projects = [];
      }

      this.orgName = orga;
    }

    try {
      this.#getOrgFromCache();
    }
    catch {
      this.projects = [];
    }

    if (this.projects.length === 0) {
      await this.#fetch();
    }

    const result: DashlogOrganizationCached = {
      orgName: this.orgName,
      lastUpdate: kDateFormatter.format(
        new Date(this.lastUpdate ?? Date.now())
      ),
      logo: this.logo,
      projects: this.projects
    };
    this.#orgCache.update(this.orgName, result);

    return {
      ...result,
      main: template.renderStatusboard(result),
      header: template.renderHeader(result)
    };
  }

  renderAllOrganizations() {
    const orgs = this.#orgCache.list();

    return Promise.all(
      orgs.map((orginizationName) => {
        const org = this.#orgCache.get(orginizationName);

        return {
          ...org,
          main: template.renderStatusboard(org),
          header: template.renderHeader(org)
        };
      })
    );
  }
}
