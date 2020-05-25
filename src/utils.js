"use strict";

// Require Node.js Dependencies
const { extname } = require("path");

// Require Third-party Dependencies
const { fetchLazy } = require("fetch-github-repositories");
const http = require("httpie");
const TOML = require("@iarna/toml");

// CONSTANTS
const PULL_URL_POSTFIX_LEN = "{/number}".length;
const COMMIT_URL_POSTFIX_LEN = "{/sha}".length;
const HTTP_HEADERS = {
    "User-Agent": process.env.GITHUB_ORG_NAME,
    Authorization: `token ${process.env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github.v3.raw"
};

async function fetchAdditionalGithubData({ full_name, pulls_url, issues_url }) {
    // https://api.github.com/repos/SlimIO/Config/[pulls || issues]{/number} (example of pulls_url)
    //                                                             ▲ here we slice this from the URL.
    const pull = pulls_url.slice(0, pulls_url.length - PULL_URL_POSTFIX_LEN);
    const issue = issues_url.slice(0, issues_url.length - PULL_URL_POSTFIX_LEN);

    const { data: pulls } = await http.get(pull, { headers: HTTP_HEADERS });
    const { data: issues } = await http.get(issue, { headers: HTTP_HEADERS });

    return { name: full_name, pr: pulls.map((row) => row.user.login), issues: issues.map((row) => row.user.login) };
}

async function fetchLastGithubCommit(commitsURL) {
    const uri = commitsURL.slice(0, commitsURL.length - COMMIT_URL_POSTFIX_LEN);

    const { data: commits } = await http.get(uri, { headers: HTTP_HEADERS });
    const lastCommit = commits[0];

    return { sha: lastCommit.sha, date: lastCommit.commit.author.date };
}

async function fetchGithubFile(name, fileName = "package.json") {
    const uri = `https://raw.githubusercontent.com/${process.env.GITHUB_ORG_NAME}/${name}/master/${fileName}`;
    const fileExt = extname(fileName);

    try {
        const { data } = await http.get(uri, { headers: HTTP_HEADERS });

        switch (fileExt) {
            case ".json":
                return JSON.parse(data);
            case ".toml":
                return TOML.parse(data);
            default:
                return data;
        }
    }
    catch {
        return null;
    }
}

function getTestFrameworkName(deps = {}) {
    if ("ava" in deps) {
        return "ava";
    }
    if ("jest" in deps) {
        return "jest";
    }
    if ("japa" in deps) {
        return "japa";
    }

    return "N/A";
}

async function fetchOneRepository(repo) {
    const [metadata, lastCommit, packageJSON, slimioTOML] = await Promise.all([
        fetchAdditionalGithubData({
            full_name: repo.full_name,
            issues_url: repo.issues_url,
            pulls_url: repo.pulls_url
        }),
        fetchLastGithubCommit(repo.commits_url),
        fetchGithubFile(repo.name, "package.json"),
        fetchGithubFile(repo.name, "slimio.toml")
    ]);
    const { pr, issues } = metadata;
    if (packageJSON === null) {
        return null;
    }
    const { name, version, engines = {}, dependencies = {}, devDependencies = {}, type = "N/A" } = packageJSON;

    return {
        name: repo.name,
        package_name: name,
        private: repo.private,
        slimio_type: slimioTOML === null ? null : slimioTOML.type,
        version,
        is_module: type === "module",
        url: repo.html_url,
        license: repo.license.name,
        fork: repo.fork,
        fork_count: repo.forks_count,
        test_framework: getTestFrameworkName(devDependencies),
        size: repo.size,
        stars: repo.stargazers_count,
        last_commit: lastCommit,
        pull_request: pr,
        issues,
        has_nyc: Reflect.has(packageJSON, "nyc"),
        dependencies_count: Object.keys(dependencies).length,
        dev_dependencies_count: Object.keys(devDependencies).length,
        nodejs_version: engines.node || null,
        default_branch: repo.default_branch
    };
}

async function fetchOrgMetadata() {
    const asyncIterator = fetchLazy(process.env.GITHUB_ORG_NAME, {
        kind: "orgs",
        token: process.env.GITHUB_TOKEN
    });

    const arrOfPromises = [];
    for await (const repo of asyncIterator) {
        if (!repo.archived && !repo.disabled) {
            arrOfPromises.push(fetchOneRepository(repo));
        }
    }

    const results = await Promise.allSettled(arrOfPromises);

    return results
        .filter((promise) => promise.status === "fulfilled" && promise.value !== null)
        .map((promise) => promise.value);
}

module.exports = {
    fetchOrgMetadata
};
