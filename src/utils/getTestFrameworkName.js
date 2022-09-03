export function getTestFrameworkName(deps = {}) {
  if ("ava" in deps) {
    return "ava";
  }
  if ("jest" in deps) {
    return "jest";
  }
  if ("japa" in deps) {
    return "japa";
  }
  if ("tape" in deps) {
    return "tape";
  }
  if ("mocha" in deps) {
    return "mocha";
  }

  return "N/A";
}
