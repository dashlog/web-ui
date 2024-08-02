// Import Third-party Dependencies
import {
  Grid,
  html
} from "https://unpkg.com/gridjs?module";
import * as storage from "../storage/index.js";

// CONSTANTS
const kDefaultColumnsHidden = [
  "private",
  "fork",
  "forked_count",
  "test_framework",
  "dependency_count",
  "dev_dependency_count"
];

const kHiddenColumnIds = new Set([
  "url",
  "package"
]);

export class Board {
  static #columns(
    ids = storage.columns.get()
  ) {
    const columns = [
      {
        id: "name",
        name: "Name",
        width: "200px",
        formatter: (cell, row) => html(`
          <a href="${row.cells[1].data}" target="_blank" style="float: left;">${cell}</a>
          <span class="icons">
            <a href="https://www.npmjs.com/package/${row.cells[2].data}" target="_blank" class="icon">
              <img src="/images/npm-icon.svg" />
            </a>
          </span>
        `)
      },
      {
        id: "url",
        name: "URL",
        hidden: true
      },
      {
        id: "package",
        name: "Package",
        hidden: true
      },
      {
        id: "version",
        name: "Version"
      },
      {
        id: "private",
        name: "Private",
        attributes: dataTdBoolean()
      },
      {
        id: "fork",
        name: "Fork",
        attributes: dataTdBoolean()
      },
      {
        id: "forked_count",
        name: html(`Forked<br/><div class="small">count</div>`)
      },
      {
        id: "branch",
        name: "Branch"
      },
      {
        id: "esm",
        name: "ESM",
        attributes: dataTdBoolean()
      },
      {
        id: "license",
        name: "License"
      },
      {
        id: "node",
        name: "Node"
      },
      {
        id: "pullrequests",
        name: "PR"
      },
      {
        id: "issues",
        name: "Issues"
      },
      {
        id: "published",
        name: "Published"
      },
      {
        id: "commit",
        name: "Commit"
      },
      {
        id: "commit_count_last_release",
        name: html(`Commits #<br/><div class="small">since last release</div>`)
      },
      {
        id: "stars",
        name: "Stars"
      },
      {
        id: "test_framework",
        name: html(`Test<br/><div class="small">framework</div>`)
      },
      {
        id: "test_coverage_lib",
        name: html(`Coverage<br/><div class="small">library</div>`)
      },
      {
        id: "dependency_count",
        name: "Deps #"
      },
      {
        id: "dev_dependency_count",
        name: "Dev Deps #"
      }
    ];

    return columns.map((column) => {
      if (!kHiddenColumnIds.has(column.id)) {
        column.hidden = ids.has(column.id);
      }

      return column;
    });
  }

  static render() {
    const hiddenIds = storage.columns.init({
      defaultHiddenColumns: kDefaultColumnsHidden
    });
    console.log("[Board] render");

    const boardHTMLElement = document.getElementById("board");
    if (!boardHTMLElement) {
      throw new Error("Unable to found HTML Div element with id 'board'");
    }

    const projects = JSON.parse(
      boardHTMLElement.getAttribute("data-json")
    );

    const grid = new Grid({
      columns: this.#columns(),
      data: projects.map((project) => [
        project.name,
        project.url,
        project.package_name,
        project.version,
        renderBoolean(project.private),
        renderBoolean(project.fork),
        project.fork_count,
        project.default_branch,
        renderBoolean(project.is_module),
        project.license,
        project.nodejs_version,
        centered(project.pull_request.length),
        centered(project.issues.length),
        centered(new Date(project.last_release).toLocaleDateString()),
        centered(new Date(project.last_commit.date).toLocaleDateString()),
        project.unreleased_commit_count,
        centered(project.stars),
        project.test_framework,
        project.coverage_lib,
        project.dependencies_count,
        project.dev_dependencies_count
      ]),
      resizable: true,
      search: true,
      sort: {
        multiColumn: false
      },
      pagination: {
        limit: 50,
        summary: false
      },
      language: {
        search: {
          placeholder: "🔍 Search..."
        }
      }
    }).render(boardHTMLElement);

    const updateGrid = (ids) => {
      grid
        .updateConfig({ columns: this.#columns(ids) })
        .forceRender();
    };

    const columnsULHTMLElement = document.getElementById("columns-list");
    columnsULHTMLElement.style.display = "none";

    for (const columnLIHTMLElement of document.querySelectorAll(".column")) {
      const columnId = columnLIHTMLElement.getAttribute("data-column-id");
      if (hiddenIds.has(columnId)) {
        columnLIHTMLElement.classList.toggle("selected");
      }

      columnLIHTMLElement.addEventListener(
        "click",
        function onClick() {
          this.classList.toggle("selected");
          const id = this.getAttribute("data-column-id");

          updateGrid(
            storage.columns.update(id)
          );
        }
      );
    }

    const dropdown = document.getElementById("columns-btn");
    if (dropdown) {
      dropdown.addEventListener("click", () => {
        dropdown.classList.toggle("button-selected");
        dropdown.setAttribute(
          "aria-expanded", dropdown.getAttribute("aria-expanded") === "true" ? "false" : "true"
        );
        columnsULHTMLElement.style.display = columnsULHTMLElement.style.display === "block" ?
          "none" : "block";
      });
    }

    document.addEventListener("click", (event) => {
      if (!columnsULHTMLElement.contains(event.target) && !dropdown.contains(event.target)) {
        columnsULHTMLElement.style.display = "none";
        dropdown.setAttribute("aria-expanded", "false");
      }
    });
  }
}

function renderBoolean(bool) {
  return centered(bool ? "✔️" : "❌");
}

function centered(value) {
  return html(`<p style="text-align: center">${value}<p>`);
}

function dataTdBoolean() {
  // eslint-disable-next-line consistent-return
  return (cell) => {
    if (cell) {
      return {
        "data-td-boolean": cell.props.content.includes("✔️") ? "true" : "false"
      };
    }
  };
}
