export function getCoverageLib(deps = {}) {
  const libs = [];
  if ("nyc" in deps) {
    libs.push("nyc");
  }
  if ("c8" in deps) {
    libs.push("c8");
  }

  return libs.length === 0 ? "N/A" : libs.join(",");
}
