# Webui
![version](https://img.shields.io/badge/dynamic/json.svg?style=for-the-badge&url=https://raw.githubusercontent.com/dashlog/web-ui/master/package.json&query=$.version&label=Version)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg?style=for-the-badge)](https://github.com/dashlog/web-ui/graphs/commit-activity)
[![mit](https://img.shields.io/github/license/Naereen/StrapDown.js.svg?style=for-the-badge)](https://github.com/dashlog/web-ui/blob/master/LICENSE)

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
UI_ADMIN_PASSWORD=xxx
```

## Contributors ✨

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-5-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://www.linkedin.com/in/thomas-gentilhomme/"><img src="https://avatars.githubusercontent.com/u/4438263?v=4?s=100" width="100px;" alt="Gentilhomme"/><br /><sub><b>Gentilhomme</b></sub></a><br /><a href="https://github.com/dashlog/web-ui/commits?author=fraxken" title="Code">💻</a> <a href="https://github.com/dashlog/web-ui/commits?author=fraxken" title="Documentation">📖</a> <a href="#security-fraxken" title="Security">🛡️</a> <a href="https://github.com/dashlog/web-ui/issues?q=author%3Afraxken" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/PierreDemailly"><img src="https://avatars.githubusercontent.com/u/39910767?v=4?s=100" width="100px;" alt="PierreDemailly"/><br /><sub><b>PierreDemailly</b></sub></a><br /><a href="https://github.com/dashlog/web-ui/commits?author=PierreDemailly" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/halcin"><img src="https://avatars.githubusercontent.com/u/7302407?v=4?s=100" width="100px;" alt="halcin"/><br /><sub><b>halcin</b></sub></a><br /><a href="https://github.com/dashlog/web-ui/commits?author=halcin" title="Code">💻</a> <a href="#design-halcin" title="Design">🎨</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/abbesAlexandre"><img src="https://avatars.githubusercontent.com/u/34767221?v=4?s=100" width="100px;" alt="yurifa"/><br /><sub><b>yurifa</b></sub></a><br /><a href="https://github.com/dashlog/web-ui/commits?author=abbesAlexandre" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://sofiand.github.io/portfolio-client/"><img src="https://avatars.githubusercontent.com/u/39944043?v=4?s=100" width="100px;" alt="Yefis"/><br /><sub><b>Yefis</b></sub></a><br /><a href="https://github.com/dashlog/web-ui/pulls?q=is%3Apr+reviewed-by%3ASofianD" title="Reviewed Pull Requests">👀</a> <a href="#design-SofianD" title="Design">🎨</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

## License
MIT
