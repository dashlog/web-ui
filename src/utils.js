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

async function fetchOrgInformation() {
    const URI = `https://api.github.com/orgs/${process.env.GITHUB_ORG_NAME}`;
    const { data } = await http.get(URI, {
        headers: HTTP_HEADERS
    });

    return data;
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

function getCoverageLib(deps = {}) {
    const libs = [];
    if ("nyc" in deps) {
        libs.push("nyc");
    }
    if ("c8" in deps) {
        libs.push("c8");
    }

    return libs.length === 0 ? "N/A" : libs.join(",");
}

async function fetchOneRepository(repo) {
    try {
        const promises = [
            fetchAdditionalGithubData({
                full_name: repo.full_name,
                issues_url: repo.issues_url,
                pulls_url: repo.pulls_url
            }),
            fetchLastGithubCommit(repo.commits_url),
            fetchGithubFile(repo.name, "package.json")
        ];
        if (process.env.GITHUB_ORG_NAME === "SlimIO") {
            promises.push(fetchGithubFile(repo.name, "slimio.toml"));
        }
        const [metadata, lastCommit, packageJSON, slimioTOML = null] = await Promise.all(promises);
        const { pr, issues } = metadata;
        const {
            name, version = "1.0.0", engines = {}, dependencies = {}, devDependencies = {}, type = "N/A"
        } = packageJSON || {};

        // eslint-disable-next-line new-cap
        lastCommit.date = Intl.DateTimeFormat("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric"
        }).format(new Date(lastCommit.date));

        return {
            name: repo.name,
            package_name: name,
            private: repo.private,
            slimio_type: slimioTOML === null ? null : slimioTOML.type,
            version,
            is_module: type === "module",
            url: repo.html_url,
            license: (repo.license || {}).name || "N/A",
            fork: repo.fork,
            fork_count: repo.forks_count,
            test_framework: getTestFrameworkName(devDependencies),
            coverage_lib: getCoverageLib(devDependencies),
            size: repo.size,
            stars: repo.stargazers_count,
            last_commit: lastCommit,
            pull_request: pr,
            issues,
            dependencies_count: Object.keys(dependencies).length,
            dev_dependencies_count: Object.keys(devDependencies).length,
            nodejs_version: engines.node || null,
            default_branch: repo.default_branch
        };
    }
    catch (error) {
        return null;
    }
}

async function fetchOrgMetadata() {
    const { avatar_url } = await fetchOrgInformation();
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
    const projects = results
        .filter((promise) => promise.status === "fulfilled" && promise.value !== null)
        .map((promise) => promise.value);

    const errors = results.filter((promise) => promise.status === "rejected").map((promise) => promise.reason);
    console.log(errors);
    console.log(`projects length: ${projects.length}`);

    return { projects, logo: avatar_url };
}

module.exports = {
    fetchOrgMetadata
};
