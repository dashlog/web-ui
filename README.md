# Webui
![version](https://img.shields.io/badge/dynamic/json.svg?url=https://raw.githubusercontent.com/dashlog/web-ui/master/package.json&query=$.version&label=Version)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/dashlog/web-ui/commit-activity)
[![mit](https://img.shields.io/github/license/Naereen/StrapDown.js.svg)](https://github.com/dashlog/web-ui/blob/master/LICENSE)

Open-source statusboard inspired by [npm statusboard](https://npm.github.io/statusboard/) that work with any kind of github orgs. The project has been designed to be a complete and standalone Node.js server (and not a github page like npm).

<p align="center">
    <img src="https://i.imgur.com/z8pb4DK.jpg">
</p>

## Requirements
- [Node.js](https://nodejs.org/en/) v16 or higher

## Getting Started

```bash
$ git clone https://github.com/dashlog/web-ui.git
$ cd web-ui
$ npm ci
$ npm start
```

## Environment Variables

To configure the project you have to set environment variables. These variables can be set in a **.env** file.
```
PORT=1337

GITHUB_ORG_NAME=NodeSecure
GITHUB_TOKEN="..."
```

## Contributors ✨

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-1-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

## License
MIT
