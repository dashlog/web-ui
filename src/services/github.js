// Import Third-party Dependencies
import * as httpie from "@myunisoft/httpie";
import { fetchLazy } from "fetch-github-repositories";

// Import Internal Dependencies
import Repository from "./repository.js";

export default class Github {
  #token = process.env.GITHUB_TOKEN;

  /**
   * @param {!string} orgName Github organization name
   *
   * @example
   * new Github("NodeSecure")
   */
  constructor(orgName) {
    this.orgName = orgName;
  }

  get name() {
    return this.orgName;
  }

  get headers() {
    return {
      "user-agent": this.orgName,
      authorization: `token ${this.#token}`,
      accept: "application/vnd.github.v3.raw"
    };
  }

  async information() {
    const { data } = await httpie.get(`https://api.github.com/orgs/${this.orgName}`, {
      headers: this.headers
    });

    return data;
  }

  async fetchRepositories() {
    const asyncIterator = fetchLazy(this.orgName, {
      kind: "orgs",
      token: this.#token
    });

    const arrOfPromises = [];
    for await (const repo of asyncIterator) {
      if (!repo.archived && !repo.disabled) {
        const serviceRepository = new Repository(this, repo);
        arrOfPromises.push(serviceRepository.information());
      }
    }

    const results = await Promise.allSettled(arrOfPromises);
    const projects = results
      .filter((promise) => promise.status === "fulfilled" && promise.value !== null)
      .map((promise) => promise.value);

    // const errors = results.filter((promise) => promise.status === "rejected").map((promise) => promise.reason);
    // console.log(errors);
    // console.log(`projects length: ${projects.length}`);

    return projects;
  }
}
