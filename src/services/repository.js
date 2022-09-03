// Import Node.js Dependencies
import path from "node:path";

// Import Third-party Dependencies
import * as httpie from "@myunisoft/httpie";
import Github from "./github";

// Import Internal Dependencies
import { getCoverageLib, getTestFrameworkName } from "../utils/index.js";

// CONSTANTS
const kDateFormatter = Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric"
});

const kPullUrlPostfixLen = "{/number}".length;
const kCommitUrlPostfixLen = "{/sha}".length;

export default class Repository {
  /**
   * @param {!Github} org Github service class
   * @param {*} repository
   */
  constructor(org, repository) {
    this.org = org;
    this.repository = repository;
  }

  async #fetchAdditionalGithubData() {
    const { full_name, pulls_url, issues_url } = this.repository;

    // https://api.github.com/repos/NodeSecure/scanner/[pulls || issues]{/number} (example of pulls_url)
    //                                                             ▲ here we slice this from the URL.
    const pull = pulls_url.slice(0, pulls_url.length - kPullUrlPostfixLen);
    const issue = issues_url.slice(0, issues_url.length - kPullUrlPostfixLen);

    const { data: pulls } = await httpie.get(pull, { headers: this.org.headers });
    const { data: issues } = await httpie.get(issue, { headers: this.org.headers });

    return {
      name: full_name,
      pr: pulls.map((row) => row.user.login),
      issues: issues.map((row) => row.user.login)
    };
  }

  async #fetchLastGithubCommit() {
    const uri = this.repository.commits_url.slice(0, this.repository.commits_url.length - kCommitUrlPostfixLen);

    const { data: commits } = await httpie.get(uri, {
      headers: this.org.headers
    });
    const lastCommit = commits[0];

    return {
      sha: lastCommit.sha,
      date: lastCommit.commit.author.date
    };
  }

  /**
   * @param {!string} fileName name of the file to fetch on the Github repository
   */
  async #fetchGithubFile(fileName = "package.json") {
    try {
      const uri = `https://raw.githubusercontent.com/${this.org.name}/${this.repository.name}/master/${fileName}`;

      const { data } = await httpie.get(uri, { headers: this.org.headers });

      switch (path.extname(fileName)) {
        case ".json":
          return JSON.parse(data);
        default:
          return data;
      }
    }
    catch {
      return {};
    }
  }

  async information() {
    try {
      const [metadata, lastCommit, packageJSON] = await Promise.all([
        this.#fetchAdditionalGithubData(),
        this.#fetchLastGithubCommit(),
        this.#fetchGithubFile("package.json")
      ]);

      const { pr, issues } = metadata;
      const {
        name = null, version = "1.0.0", engines = {}, dependencies = {}, devDependencies = {}, type = "N/A"
      } = packageJSON;
      lastCommit.date = kDateFormatter.format(new Date(lastCommit.date));

      return {
        name: this.repository.name,
        package_name: name,
        private: this.repository.private,
        version,
        is_module: type === "module",
        url: this.repository.html_url,
        license: (this.repository.license || {}).name || "N/A",
        fork: this.repository.fork,
        fork_count: this.repository.forks_count,
        test_framework: getTestFrameworkName(devDependencies),
        coverage_lib: getCoverageLib(devDependencies),
        size: this.repository.size,
        stars: this.repository.stargazers_count,
        last_commit: lastCommit,
        pull_request: pr,
        issues,
        dependencies_count: Object.keys(dependencies).length,
        dev_dependencies_count: Object.keys(devDependencies).length,
        nodejs_version: engines.node || null,
        default_branch: this.repository.default_branch
      };
    }
    catch {
      return null;
    }
  }
}
