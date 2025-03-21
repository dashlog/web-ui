import fs from "fs";
import path from "path";
import { logger } from "../logger.js";

const GITHUB_API_BASE = "https://api.github.com";
const ORG_NAME = process.env.GITHUB_ORG_NAME;
const CACHE_FILE = path.join(process.cwd(), "cache.json");
const CACHE_EXPIRY = 10 * 60 * 60 * 1000; // 10 hours
const REPOS_PER_PAGE = 100;

export default class DataFetcher {
  constructor() {
    this.orgName = ORG_NAME;
    this.lastUpdate = null;
    this.repos = [];

    this.timer = setInterval(() => {
      this.fetchRepos().catch((error) => {
        logger.error(`[DataFetcher] Fetch error: ${error.message}`);
      });
    }, CACHE_EXPIRY);

    this.loadCache();
  }

  async fetchRepos() {
    console.log("🔄 Fetching repo list from GitHub in batches...");

    const headers = {
      Authorization: `token ${process.env.GITHUB_TOKEN}`,
      "User-Agent": "GitHub Fetcher"
    };
    let url = `${GITHUB_API_BASE}/orgs/${this.orgName}/repos?per_page=${REPOS_PER_PAGE}&page=1`;
    let allRepos = [];

    try {
      while (url) {
        const response = await fetch(url, { headers });
        const repos = await response.json();
        allRepos = allRepos.concat(repos);

        const linkHeader = response.headers.get("link");
        url = this.getNextPageUrl(linkHeader);
      }

      this.repos = allRepos.map((repo) => ({
        name: repo.name,
        url: repo.html_url,
        private: repo.private,
        forks: repo.forks_count,
        stars: repo.stargazers_count,
        issues: repo.open_issues_count,
        last_commit: repo.pushed_at,
      }));

      this.lastUpdate = new Date();
      this.saveCache();
    } catch (error) {
      logger.error(`[DataFetcher] Error fetching repos: ${error.message}`);
    }
  }

  getNextPageUrl(linkHeader) {
    if (!linkHeader) return null;
    const match = linkHeader.match(/<([^>]+)>; rel="next"/);
    return match ? match[1] : null;
  }

  saveCache() {
    fs.writeFileSync(
      CACHE_FILE,
      JSON.stringify({
        lastUpdate: this.lastUpdate,
        repos: this.repos,
      })
    );
  }

  loadCache() {
    if (fs.existsSync(CACHE_FILE)) {
      try {
        const cache = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
        if (Date.now() - new Date(cache.lastUpdate).getTime() < CACHE_EXPIRY) {
          console.log("⏳ Using cached data.");
          this.lastUpdate = cache.lastUpdate;
          this.repos = cache.repos;
        } else {
          console.log("⚠️ Cache expired, fetching new data...");
          this.fetchRepos();
        }
      } catch (error) {
        logger.error("[DataFetcher] Error loading cache: " + error.message);
        this.fetchRepos();
      }
    } else {
      this.fetchRepos();
    }
  }

  async getData() {
    return { orgName: this.orgName, lastUpdate: this.lastUpdate, repos: this.repos };
  }

  close() {
    clearInterval(this.timer);
  }
}
