// Import Internal Dependencies
import { createDOMElement } from "../utils.js";

export class Organization {
  // When adding org, we need to make sure that the added org become the active one
  static nextActiveOrg = null;

  static get orgs() {
    return JSON.parse(localStorage.getItem("orgs") ?? "[]");
  }

  static set orgs(orgs) {
    localStorage.setItem("orgs", JSON.stringify(orgs));
  }

  /**
   * @param {!string} orgName
   * @returns {void}
   */
  static setActive(orgName) {
    const updatedOrgs = this.orgs.map((org) => {
      org.active = org.orgName === orgName;

      return org;
    });

    localStorage.setItem("orgs", JSON.stringify(updatedOrgs));
  }

  static render(
    callback = () => void 0,
    socket
  ) {
    console.log("[Org] render");

    const orgs = this.orgs;
    const popupEl = document.getElementById("add-org-popup");
    const loaderEl = document.querySelector("#popup-loader");
    const inputEl = document.getElementById("add-org-input");
    const submitBtnEl = document.getElementById("add-org-btn");

    const fragment = document.createDocumentFragment();

    for (const org of orgs) {
      const orgHTMLElement = createDOMElement("div", {
        classList: ["org"],
        childs: [
          createDOMElement("img", {
            attributes: {
              src: org.logo,
              title: org.orgName,
              height: 30,
              width: 30
            }
          })
        ]
      });

      if (orgs.length > 1) {
        const closeDiv = createDOMElement("div", {
          classList: ["close"]
        });
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

        orgHTMLElement.appendChild(closeDiv);
      }

      orgHTMLElement.addEventListener("click", () => {
        this.setActive(org.orgName);

        document.querySelector("header").innerHTML = org.header;
        document.querySelector("main").innerHTML = org.main;

        if (new Date(org.lastUpdate).getTime() < Date.now() - (10 * 60 * 60 * 1000)) {
          socket.send(JSON.stringify({
            orgName: org.orgName,
            token: JSON.parse(localStorage.getItem("token"))
          }));
          document.querySelector("h1").innerHTML += " (updating...)";

          return;
        }

        this.render(callback);
        callback();
      });

      fragment.appendChild(orgHTMLElement);
    }

    const addOrgEl = createDOMElement("img", {
      attributes: {
        src: "/images/plus.png"
      }
    });

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

        Organization.nextActiveOrg = inputEl.value;
      }

      formEl.addEventListener("submit", onSubmit, { signal: controller.signal });
    });
    fragment.appendChild(addOrgEl);

    return fragment;
  }
}

/**
 * @param {!string} token
 * @returns {boolean}
 */
function isTokenExpired(
  token
) {
  const expiry = (JSON.parse(atob(token.split(".")[1]))).exp;

  return (Math.floor((new Date()).getTime() / 1000)) >= expiry;
}
