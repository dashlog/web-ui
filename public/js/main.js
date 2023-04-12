/* eslint-disable no-invalid-this */

function tagElementClick() {
  this.classList.toggle("disabled");

  const dataValue = this.getAttribute("data-value");
  const th = document.querySelector(`[data-sort="${dataValue}"]`);
  th.classList.toggle("hidden");

  document.querySelectorAll(`.${dataValue}`)
    .forEach((element) => element.classList.toggle("hidden"));
}

function isTokenExpired(token) {
  const expiry = (JSON.parse(atob(token.split(".")[1]))).exp;

  return (Math.floor((new Date()).getTime() / 1000)) >= expiry;
}

document.addEventListener("DOMContentLoaded", () => {
  const socket = new WebSocket("ws://localhost:1338");

  let popupEl = document.getElementById("add-org-popup");
  let loaderEl = document.querySelector("#popup-loader");
  let inputEl = document.getElementById("add-org-input");
  let submitBtnEl = document.getElementById("add-org-btn");
  const pageLoaderEl = document.querySelector(".page-loader");

  function buildOrglist() {
    const orgs = JSON.parse(localStorage.getItem("orgs") ?? "[]");
    const orgsElement = document.getElementById("orgs");
    orgsElement.innerHTML = "";

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
        document.querySelector("header").innerHTML = org.header;
        document.querySelector("main").innerHTML = org.main;

        buildOrglist();
        initListJS();
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
      const formEl = document.querySelector("#add-org-form");
      const closePopupEl = document.querySelector("#close-popup");

      closePopupEl.addEventListener("click", () => {
        popupEl.classList.remove("opened");
      });

      popupEl.classList.add("opened");
      const controller = new AbortController();
      function onSubmit(e) {
        e.preventDefault();
        const token = JSON.parse(localStorage.getItem("token") ?? "null");
        const message = { orgName: inputEl.value };

        if (token && !isTokenExpired(token)) {
          message.token = token;
        }
        else {
          // eslint-disable-next-line no-alert
          const password = prompt("Password ?", "");
          message.password = password;
        }

        socket.send(JSON.stringify(message));
        loaderEl.classList.remove("hidden");
        inputEl.disabled = true;
        submitBtnEl.disabled = true;
        controller.abort();
      }
      formEl.addEventListener("submit", onSubmit, { signal: controller.signal });
    });

    orgsElement.appendChild(addOrgEl);
  }

  function initListJS() {
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
      .forEach((element) => {
        element.addEventListener("click", tagElementClick);
      });
  }

  socket.addEventListener("message", ({ data }) => {
    const orgs = JSON.parse(localStorage.getItem("orgs") ?? "[]");
    const { orgName, logo, main, header, token, error } = JSON.parse(data);

    if (error) {
      // eslint-disable-next-line no-alert
      alert(error);

      if (error !== "Not found") {
        localStorage.removeItem("token");
      }
    }
    else if (main) {
      if (token) {
        localStorage.setItem("token", JSON.stringify(token));
      }
      const orgIndex = orgs.findIndex((org) => org.orgName === orgName);

      if (orgIndex > -1) {
        orgs[orgIndex] = { orgName, logo, main, header };
      }
      else {
        orgs.push({ orgName, logo, main, header });
      }

      localStorage.setItem("orgs", JSON.stringify(orgs));
      document.querySelector("main").innerHTML = main;
      document.querySelector("header").innerHTML = header;
      pageLoaderEl.classList.add("hidden");

      buildOrglist();
      initListJS();
    }

    popupEl.classList.remove("opened");
    popupEl = document.querySelector("#add-org-popup");
    loaderEl = document.querySelector("#popup-loader");
    inputEl = document.querySelector("#add-org-input");
    submitBtnEl = document.querySelector("#add-org-btn");

    inputEl.disabled = false;
    submitBtnEl.disabled = false;

    if (!loaderEl.classList.contains("hidden")) {
      loaderEl.classList.add("hidden");
    }
  });
});
