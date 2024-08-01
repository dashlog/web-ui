// CONSTANTS
const kStatusBoardColumns = [
  "name",
  "license",
  "test",
  "type",
  "public",
  "pkg-name",
  "version",
  "node",
  "esm",
  "fork",
  "fork-count",
  "size",
  "stars",
  { name: "last-commit", attr: "data-timestamp" },
  { name: "last-release", attr: "data-timestamp" },
  "unreleased-commit",
  "pr",
  "issues",
  "nyc",
  "state",
  "dep",
  "devDep",
  "branch"
];

export class Board {
  static render() {
    console.log("[Board] render");

    new List("data", {
      valueNames: [...kStatusBoardColumns]
    });

    const tags = document.getElementById("tags");
    tags.style.display = "none";
    for (const tagElement of document.querySelectorAll(".tag")) {
      tagElement.addEventListener("click", tagElementClick);
    }

    const dropdown = document.getElementById("filter");
    if (dropdown) {
      dropdown.addEventListener("click", () => {
        dropdown.classList.toggle("button-selected");
        dropdown.setAttribute(
          "aria-expanded", dropdown.getAttribute("aria-expanded") === "true" ? "false" : "true"
        );
        tags.style.display = tags.style.display === "block" ?
          "none" : "block";
      });
    }

    document.addEventListener("click", (event) => {
      if (!tags.contains(event.target) && !dropdown.contains(event.target)) {
        tags.style.display = "none";
        dropdown.setAttribute("aria-expanded", "false");
      }
    });
  }
}

function tagElementClick() {
  this.classList.toggle("selected");

  let hiddenTags = JSON.parse(localStorage.getItem("hidden-tags")) ?? [];
  const dataValue = this.getAttribute("data-value");

  if (hiddenTags.includes(dataValue)) {
    hiddenTags = hiddenTags.filter((item) => item !== dataValue);
  }
  else {
    hiddenTags.push(dataValue);
  }

  localStorage.setItem("hidden-tags", JSON.stringify(hiddenTags));

  const th = document.querySelector(`[data-sort="${dataValue}"]`);
  th.classList.toggle("hidden");

  document.querySelectorAll(`.${dataValue}`)
    .forEach((element) => element.classList.toggle("hidden"));
}
