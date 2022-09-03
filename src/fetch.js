// Import Internal Dependencies
import Github from "./services/github.js";

export async function fetchOrgMetadata() {
  const githubRepository = new Github(process.env.GITHUB_ORG_NAME);

  const { avatar_url } = await githubRepository.information();
  const projects = await githubRepository.fetchRepositories();

  return { projects, logo: avatar_url };
}
