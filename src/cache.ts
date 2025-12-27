// Import Node.js Dependencies
import fs from "node:fs";
import path from "node:path";

// Import Third-party Dependencies
import type { DashlogOrganization } from "@dashlog/core";
import type { FastifyBaseLogger } from "fastify";

// Import Internal Dependencies
import * as template from "./template.ts";

export type DashlogOrganizationCached = DashlogOrganization<any> & {
  orgName: string;
  lastUpdate: string;
};

// CONSTANTS
export const CACHE_PATH = path.join(process.cwd(), "/data");
const kOrgsLocation = path.join(CACHE_PATH, "orgs.json");

export class OrganizationCache {
  #logger: FastifyBaseLogger;

  constructor(
    logger: FastifyBaseLogger
  ) {
    this.#logger = logger;
  }

  list(): string[] {
    return JSON.parse(
      fs.readFileSync(kOrgsLocation, "utf-8")
    );
  }

  get(
    name: string
  ): DashlogOrganizationCached {
    return JSON.parse(
      fs.readFileSync(path.join(CACHE_PATH, `${name}.json`), "utf-8")
    );
  }

  getAll() {
    return this.list().map((name) => {
      const org = this.get(name);

      return {
        ...org,
        main: template.renderStatusboard(org),
        header: template.renderHeader(org)
      };
    });
  }

  remove(
    name: string
  ) {
    try {
      const orgs = this.list()
        .filter((org) => org.toLowerCase() !== name.toLowerCase());

      fs.writeFileSync(kOrgsLocation, JSON.stringify(orgs));
      fs.rmSync(path.join(CACHE_PATH, `${name}.json`));
    }
    catch (error: any) {
      // Do nothing, file doesn't exists.
      this.#logger.error(`Failed to update orgs.json: ${error.message}`);
    }
  }

  update(
    name: string,
    data: DashlogOrganizationCached
  ) {
    fs.writeFileSync(
      path.join(CACHE_PATH, `${name}.json`),
      JSON.stringify(data)
    );

    this.#updateAll(name);
  }

  #updateAll(
    name: string
  ) {
    try {
      const orgs = this.list();
      if (orgs.find((org) => org.toLowerCase() === name.toLowerCase())) {
        return;
      }

      orgs.push(name);
      fs.writeFileSync(kOrgsLocation, JSON.stringify(orgs));
    }
    catch (error: any) {
      // writeFileSync threw because the file doesn't exists.
      this.#logger.error(`Failed to update orgs.json: ${error.message}`);
      fs.writeFileSync(kOrgsLocation, JSON.stringify([name]));
    }
  }
}
