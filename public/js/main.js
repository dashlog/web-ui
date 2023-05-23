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

  window.onbeforeunload = () => {
    socket.onclose = () => void 0;
    socket.close();
  };

  let popupEl = document.getElementById("add-org-popup");
  let loaderEl = document.querySelector("#popup-loader");
  let inputEl = document.getElementById("add-org-input");
  let submitBtnEl = document.getElementById("add-org-btn");
  const pageLoaderEl = document.querySelector(".page-loader");

  function makeActive(orgName) {
    const orgs = JSON.parse(localStorage.getItem("orgs") ?? "[]");

    localStorage.setItem("orgs", JSON.stringify(orgs.map((org) => {
      if (org.orgName === orgName) {
        org.active = true;
      }
      else {
        org.active = false;
      }

      return org;
    })));
  }

  function buildOrglist() {
    const orgs = JSON.parse(localStorage.getItem("orgs") ?? "[]");
    const orgsElement = document.getElementById("orgs");
    orgsElement.innerHTML = "";

    for (const org of orgs) {
      const orgDiv = document.createElement("div");
      orgDiv.classList.add("org");
      const div = document.createElement("div");
      div.style.position = "relative";
      const img = document.createElement("img");
      img.src = org.logo;
      img.title = org.orgName;
      img.height = 30;
      img.width = 30;
      div.appendChild(img);

      if (orgs.length > 1) {
        const closeDiv = document.createElement("div");
        closeDiv.classList.add("close");
        div.appendChild(closeDiv);

        closeDiv.addEventListener("click", (e) => {
          e.stopPropagation();
          const token = JSON.parse(localStorage.getItem("token") ?? "null");
          const message = { removeOrg: org.orgName };

          if (token && !isTokenExpired(token)) {
            message.token = token;
          }
          else {
            // eslint-disable-next-line no-alert
            const password = prompt("Password ?", "");
            message.password = password;
          }

          socket.send(JSON.stringify(message));
        });
      }

      orgDiv.appendChild(div);
      orgDiv.addEventListener("click", () => {
        makeActive(org.orgName);

        document.querySelector("header").innerHTML = org.header;
        document.querySelector("main").innerHTML = org.main;

        if (new Date(org.lastUpdate).getTime() < Date.now() - (10 * 60 * 60 * 1000)) {
          socket.send(JSON.stringify({ orgName: org.orgName, token: JSON.parse(localStorage.getItem("token")) }));
          document.querySelector("h1").innerHTML += " (updating...)";

          return;
        }

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
    const { orgName, logo, main, header, token, error, lastUpdate, orgs, removeOrg } = JSON.parse(data);

    const localOrgs = JSON.parse(localStorage.getItem("orgs") ?? "[]");

    if (removeOrg) {
      const orgIndex = localOrgs.findIndex((o) => o.orgName === removeOrg);

      if (orgIndex > -1) {
        const previousOrg = localOrgs[orgIndex - 1] ?? localOrgs[orgIndex + 1];
        localOrgs.splice(orgIndex, 1);
        localStorage.setItem("orgs", JSON.stringify(localOrgs));

        document.querySelector("header").innerHTML = previousOrg.header;
        document.querySelector("main").innerHTML = previousOrg.main;
      }

      buildOrglist();
    }

    const activeOrg = localOrgs.find((org) => org.active);
    if (orgs) {
      localStorage.setItem("orgs", JSON.stringify(orgs));

      if (activeOrg) {
        makeActive(activeOrg.orgName);
      }

      return;
    }

    if (error) {
      // eslint-disable-next-line no-alert
      alert(error);

      if (error !== "Not found") {
        localStorage.removeItem("token");
      }
    }
    else if (main) {
      const localOrgs = JSON.parse(localStorage.getItem("orgs") ?? "[]");
      const activeOrg = localOrgs.find((org) => org.active);

      if (token) {
        localStorage.setItem("token", JSON.stringify(token));
      }
      const orgIndex = localOrgs.findIndex((org) => org.orgName === orgName);

      if (orgIndex > -1) {
        localOrgs[orgIndex] = { orgName, logo, main, header, lastUpdate };
      }
      else {
        localOrgs.push({ orgName, logo, main, header, lastUpdate });
      }

      localStorage.setItem("orgs", JSON.stringify(localOrgs));

      if (activeOrg) {
        if (activeOrg.orgName !== orgName) {
          socket.send(JSON.stringify({ activeOrg: activeOrg.orgName }));

          return;
        }
      }
      else {
        makeActive(orgName);
      }

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
