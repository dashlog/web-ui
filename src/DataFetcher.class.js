// Import Third-party Dependencies
import { fetchOrgMetadata } from "@dashlog/core";
import cacache from "cacache";

// Import Internal Dependencies
import { CACHE_PATH } from "./constants.js";

// CONSTANTS
const kDateFormatter = Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric"
});

async function saveOrgInCache(orgName) {
  try {
    const { data } = await cacache.get(CACHE_PATH, "orgs");
    const orgs = JSON.parse(data.toString());

    if (orgs.find((org) => org.toLowerCase() === orgName.toLowerCase())) {
      return;
    }
    orgs.push(orgName);
    await cacache.put(CACHE_PATH, "orgs", JSON.stringify(orgs));
  }
  catch (error) {
    await cacache.put(CACHE_PATH, "orgs", JSON.stringify([orgName]));
  }
}

export async function removeOrgFromCache(orgName) {
  try {
    const { data } = await cacache.get(CACHE_PATH, "orgs");
    const orgs = JSON.parse(data.toString()).filter((org) => org.toLowerCase() !== orgName.toLowerCase());

    await cacache.put(CACHE_PATH, "orgs", JSON.stringify(orgs));
    await cacache.rm.entry(CACHE_PATH, orgName);
  }
  catch (error) {
    // Do nothing, cache is empty
  }
}

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

  async #getOrgFromCache(orgName) {
    const { data: buffer } = await cacache.get(CACHE_PATH, this.orgName);
    const data = JSON.parse(buffer.toString());

    this.logo = data.logo;
    this.projects = data.projects;
    this.lastUpdate = new Date(data.lastUpdate);

    if (this.lastUpdate.getTime() < Date.now() - (10 * 60 * 60 * 1000)) {
      throw new Error("Cache is outdated");
    }
  }

  async #fetch() {
    try {
      await this.#getOrgFromCache(this.orgName);
    }
    catch {
      const result = await fetchOrgMetadata(this.orgName);

      this.logo = result.logo;
      this.projects = result.projects;
      this.lastUpdate = new Date();
    }

    await cacache.put(CACHE_PATH, this.orgName, JSON.stringify({
      logo: this.logo,
      projects: this.projects,
      lastUpdate: this.lastUpdate,
      orgName: this.orgName
    }));
    await saveOrgInCache(this.orgName);
  }

  close() {
    clearInterval(this.timer);
  }

  async getData(orga) {
    if (orga) {
      if (this.orgName !== orga) {
        this.projects = null;
      }

      this.orgName = orga;
    }

    try {
      await this.#getOrgFromCache(this.orgName);
    }
    catch (error) {
      this.projects = null;
    }

    if (this.projects === null) {
      await this.#fetch();
    }

    const result = {
      orgName: this.orgName,
      lastUpdate: kDateFormatter.format(
        new Date(this.lastUpdate ?? Date.now())
      ),
      logo: this.logo,
      projects: this.projects
    };

    await cacache.put(CACHE_PATH, this.orgName, JSON.stringify(result));
    await saveOrgInCache(this.orgName);

    return result;
  }
}
