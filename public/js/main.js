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
  const socket = new WebSocket("ws://localhost:1338");

  let popupEl = document.getElementById("add-org-popup");
  let loaderEl = document.querySelector("#popup-loader");

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

  function buildOrglist() {
    const orgs = JSON.parse(localStorage.getItem("orgs") ?? "[]");
    const orgsElement = document.getElementById("orgs");

    for (const org of orgs) {
      const orgDiv = document.createElement("div");
      orgDiv.classList.add("org");

      const img = document.createElement("img");
      img.src = org.logo;
      img.title = org.orgName;
      img.height = 30;
      img.width = 30;

      orgDiv.appendChild(img);
      orgDiv.addEventListener("click", () => {
        const cleanHtmlString = org.html.replace(/\n|\r|\t/g, "");
        const body = /<body.*?>([\s\S]*)<\/body>/.exec(cleanHtmlString)[1];
        document.querySelector("body").innerHTML = body;
        buildOrglist();
      });

      orgsElement.appendChild(orgDiv);
    }

    const addOrgEl = document.createElement("img");
    addOrgEl.src = "/images/plus.png";
    addOrgEl.height = 18;
    addOrgEl.width = 18;
    addOrgEl.style.position = "relative";
    addOrgEl.style.top = "6px";
    addOrgEl.style.cursor = "pointer";

    addOrgEl.addEventListener("click", () => {
      const formEl = document.getElementById("add-org-form");
      const inputEl = document.getElementById("add-org-input");
      const closePopupEl = document.getElementById("close-popup");
      closePopupEl.addEventListener("click", () => {
        popupEl.classList.remove("opened");
      });

      popupEl.classList.add("opened");
      formEl.addEventListener("submit", (e) => {
        e.preventDefault();
        socket.send(JSON.stringify({
          orgName: inputEl.value
        }));
        loaderEl.classList.remove("hidden");
        inputEl.disabled = true;
      });
    });

    orgsElement.appendChild(addOrgEl);
  }

  socket.addEventListener("message", ({ data }) => {
    const orgs = JSON.parse(localStorage.getItem("orgs") ?? "[]");
    const { orgName, logo, html, error } = JSON.parse(data);

    if (error) {
      // eslint-disable-next-line no-alert
      alert(error);
    }
    else if (html) {
      const orgIndex = orgs.findIndex((org) => org.orgName === orgName);

      if (orgIndex > -1) {
        orgs[orgIndex] = { orgName, logo, html };
      }
      else {
        orgs.push({ orgName, logo, html });
      }

      localStorage.setItem("orgs", JSON.stringify(orgs));

      const cleanHtmlString = html.replace(/\n|\r|\t/g, "");
      const body = /<body.*?>([\s\S]*)<\/body>/.exec(cleanHtmlString)[1];
      document.getElementsByTagName("body")[0].innerHTML = body;

      popupEl = document.getElementById("add-org-popup");
      loaderEl = document.querySelector("#popup-loader");

      buildOrglist();
    }
  });
});
