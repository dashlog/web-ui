// Import Internal Dependencies
import { Organization } from "./components/Org.js";
import { Board } from "./components/Board.js";

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
  const orgsElement = document.getElementById("orgs");

  socket.addEventListener("message", ({ data }) => {
    const { orgName, logo, main, header, token, error, lastUpdate, orgs, removeOrg } = JSON.parse(data);

    const localOrgs = Organization.orgs;

    if (removeOrg) {
      const orgIndex = localOrgs.findIndex((o) => o.orgName === removeOrg);

      if (orgIndex > -1) {
        const previousOrg = localOrgs[orgIndex - 1] ?? localOrgs[orgIndex + 1];
        localOrgs.splice(orgIndex, 1);
        Organization.orgs = localOrgs;

        document.querySelector("header").innerHTML = previousOrg.header;
        document.querySelector("main").innerHTML = previousOrg.main;
      }

      const fragment = Organization.render(
        () => Board.render(),
        socket
      );
      orgsElement.innerHTML = "";
      orgsElement.appendChild(fragment);

      Board.render();
    }

    const activeOrg = localOrgs.find((org) => org.active);
    if (orgs) {
      Organization.orgs = orgs;

      if (activeOrg) {
        Organization.setActive(activeOrg.orgName);
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

      Organization.orgs = localOrgs;

      if (activeOrg) {
        if (activeOrg.orgName !== orgName && Organization.nextActiveOrg !== orgName) {
          socket.send(JSON.stringify({ activeOrg: activeOrg.orgName }));

          return;
        }
      }
      else {
        Organization.setActive(orgName);
      }

      document.querySelector("main").innerHTML = main;
      document.querySelector("header").innerHTML = header;
      pageLoaderEl.classList.add("hidden");

      const fragment = Organization.render(
        () => Board.render(),
        socket
      );
      orgsElement.innerHTML = "";
      orgsElement.appendChild(fragment);
      Board.render();
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
