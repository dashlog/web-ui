/**
 * @param {object} [options]
 * @param {string} [options.defaultHiddenColumns=[]]
 * @returns {Set<string>}
 */
export function init(
  options = {}
) {
  const { defaultHiddenColumns = [] } = options;

  const item = localStorage.getItem("hidden-columns");
  if (item === null) {
    set(defaultHiddenColumns);
  }

  return get();
}

/**
 * @returns {Set<string>}
 */
export function get() {
  return new Set(
    JSON.parse(localStorage.getItem("hidden-columns")) ?? []
  );
}

/**
 * @param {(string[]|Set<string>)} ids
 * @returns {void}
 */
export function set(
  ids
) {
  /** @type {string[]} */
  let data;

  if (Array.isArray(ids)) {
    data = ids;
  }
  else if (ids instanceof Set) {
    data = [...ids];
  }
  else {
    throw new Error("unsupported ids argument type");
  }

  localStorage.setItem(
    "hidden-columns",
    JSON.stringify(data)
  );
}

/**
 * @param {!string} id
 * @returns {Set<string>}
 */
export function update(
  id
) {
  const ids = get();
  ids[ids.has(id) ? "delete" : "add"](id);

  set(ids);

  return ids;
}
