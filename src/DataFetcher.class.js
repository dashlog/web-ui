
// Import Third-party Dependencies
import { fetchOrgMetadata } from "@dashlog/core";

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
  orgName = process.env.GITHUB_ORG_NAME;
  lastUpdate = null;
  logo = "";
  projects = null;

  constructor() {
    this.timer = setInterval(() => {
      this.#fetch().catch(console.error);
    }, 10 * 60_000);
  }

  async #fetch() {
    const result = await fetchOrgMetadata(this.orgName);

    this.logo = result.logo;
    this.projects = result.projects;
    this.lastUpdate = new Date();
  }

  close() {
    clearInterval(this.timer);
  }

  async getData() {
    if (this.projects === null) {
      await this.#fetch();
    }

    return {
      orgName: this.orgName,
      lastUpdate: kDateFormatter.format(
        new Date(this.lastUpdate)
      ),
      logo: this.logo,
      projects: this.projects
    };
  }
}
