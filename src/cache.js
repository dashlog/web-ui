// Import Third-party Dependencies
import cacache from "cacache";

// Import Internal Dependencies
import * as template from "./template.js";
import { CACHE_PATH } from "./constants.js";

export async function getOrg(orgName) {
  const { data } = typeof orgName === "string" ?
    await cacache.get(CACHE_PATH, orgName) :
    await cacache.get(CACHE_PATH, "orgs");

  return JSON.parse(data.toString());
}

export async function getAll() {
  const orgs = await getOrg();

  return Promise.all(
    orgs.map(async(orginizationName) => {
      const org = await getOrg(orginizationName);

      return {
        ...org,
        main: template.renderStatusboard(org),
        header: template.renderHeader(org)
      };
    })
  )
}

export async function saveOne(orgName, data) {
  await cacache.put(CACHE_PATH, orgName, JSON.stringify(data));
  await updateAll(orgName);
}

export async function updateAll(orgName) {
  try {
    const orgs = await getOrg();
    if (orgs.find((org) => org.toLowerCase() === orgName.toLowerCase())) {
      return;
    }

    orgs.push(orgName);
    await cacache.put(CACHE_PATH, "orgs", JSON.stringify(orgs));
  }
  catch (error) {
    await cacache.put(CACHE_PATH, "orgs", JSON.stringify([orgName]));
  }
}

export async function removeOne(orgName) {
  try {
    const orgs = (await getOrg())
      .filter((org) => org.toLowerCase() !== orgName.toLowerCase());

    await cacache.put(CACHE_PATH, "orgs", JSON.stringify(orgs));
    await cacache.rm.entry(CACHE_PATH, orgName);
  }
  catch (error) {
    // Do nothing, cache is empty
  }
}
