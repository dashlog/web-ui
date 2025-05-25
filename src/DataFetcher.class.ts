// Import Third-party Dependencies
import {
  fetchOrgMetadata,
  type DashlogRepository
} from "@dashlog/core";

// Import Internal Dependencies
import * as orgCache from "./cache.js";
import { logger } from "./logger.js";

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
  orgName = process.env.GITHUB_ORG_NAME!;
  lastUpdate: Date;
  logo = "";
  projects: DashlogRepository[] = [];
  timer: NodeJS.Timeout;

  constructor() {
    this.timer = setInterval(() => {
      this.#fetch().catch((error) => {
        logger.error(`[DataFetcher:constructor] An error occurred during fetching: ${error.message}`);
      });
    }, 10 * 60_000);
  }

  #getOrgFromCache() {
    const data = orgCache.getOrg(this.orgName);

    this.logo = data.logo;
    this.projects = data.projects;
    this.lastUpdate = new Date(data.lastUpdate);

    if (this.lastUpdate.getTime() < Date.now() - (10 * 60 * 60 * 1000)) {
      logger.error(
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

    orgCache.saveOne(this.orgName, {
      logo: this.logo,
      projects: this.projects,
      lastUpdate: this.lastUpdate.toJSON(),
      orgName: this.orgName
    });
  }

  close() {
    clearInterval(this.timer);
  }

  async getData(
    orga?: string
  ): Promise<orgCache.DashlogOrganizationCached> {
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

    const result: orgCache.DashlogOrganizationCached = {
      orgName: this.orgName,
      lastUpdate: kDateFormatter.format(
        new Date(this.lastUpdate ?? Date.now())
      ),
      logo: this.logo,
      projects: this.projects
    };
    orgCache.saveOne(this.orgName, result);

    return result;
  }
}
