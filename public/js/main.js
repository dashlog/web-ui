/* eslint-disable no-invalid-this */

function tagElementClick() {
  this.classList.toggle("disabled");

  const dataValue = this.getAttribute("data-value");
  const th = document.querySelector(`[data-sort="${dataValue}"]`);
  th.classList.toggle("hidden");

  document.querySelectorAll(`.${dataValue}`)
    .forEach((element) => element.classList.toggle("hidden"));
}

document.addEventListener("DOMContentLoaded", () => {
  new List("data", {
    valueNames: [
      "name", "license", "test", "type", "private",
      "pkg-name", "version", "node", "esm", "fork", "fork-count",
      "size", "stars", { name: "last-commit", attr: "data-timestamp" },
      { name: "last-release", attr: "data-timestamp" }, "unreleased-commit",
      "pr", "issues", "nyc", "state", "dep", "devDep", "branch"
    ]
  });

  document.querySelectorAll(".tag")
    .forEach((element) => element.addEventListener("click", tagElementClick));
});
