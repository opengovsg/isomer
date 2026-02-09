import { type Octokit } from "@octokit/rest";

interface GetRepoContentsParams {
  site: string;
  octokit: Octokit;
  useStagingBranch?: boolean;
}

// This function gets the name of the resource room for the Jekyll site
export const getResourceRoomName = async ({
  site,
  octokit,
  useStagingBranch = false,
}: GetRepoContentsParams) => {
  // Read the _config.yml file from the GitHub API
  const config = await getFileContents({
    site,
    path: "_config.yml",
    octokit,
    useStagingBranch,
  });

  if (!config) {
    console.error("Error reading _config.yml");
    return null;
  }

  // Find the resource room name with the key `resources_name`
  try {
    const match = /resources_name: (.*)/.exec(config);

    if (!match) {
      throw new Error("Resource room name not found in _config.yml");
    }

    return match[1]?.trim();
  } catch (error) {
    console.error("Resource room name not found in _config.yml");
    return null;
  }
};

// This function gets all folders in the Jekyll site
export const getAllFolders = async ({
  site,
  octokit,
  useStagingBranch = false,
}: GetRepoContentsParams) => {
  // Read the contents of the GitHub repository
  const { data } = await octokit.repos.getContent({
    owner: "isomerpages",
    repo: site,
    path: "",
    ref: useStagingBranch ? "staging" : "master",
  });

  if (!Array.isArray(data)) {
    console.error("Unexpected data returned from GitHub API in getAllFolders");
    return [];
  }

  // Filter out folders from the repository contents
  return data
    .filter((item) => item.type === "dir" && item.name.startsWith("_"))
    .map((item) => item.path);
};

// This function gets all orphan pages in the Jekyll site
export const getOrphanPages = async ({
  site,
  octokit,
  useStagingBranch = false,
}: GetRepoContentsParams) => {
  // Get all pages in the "pages" folder
  const { data } = await octokit.repos.getContent({
    owner: "isomerpages",
    repo: site,
    path: "pages",
    ref: useStagingBranch ? "staging" : "master",
  });

  if (!Array.isArray(data)) {
    console.error("Unexpected data returned from GitHub API in getOrphanPages");
    return [];
  }

  // Filter out pages in the "pages" folder
  const orphanPages = data
    .filter((item) => item.type === "file" && item.name.endsWith(".md"))
    .map((item) => item.path);

  return [
    ...orphanPages,
    // Add index.md at the root
    "index.md",
  ];
};

interface GetRepoPathContentsParams {
  site: string;
  path: string;
  octokit: Octokit;
  useStagingBranch?: boolean;
}

// This function gets the recursive tree of the repository
export const getRecursiveTree = async ({
  site,
  path,
  octokit,
  useStagingBranch = false,
}: GetRepoPathContentsParams) => {
  // Get the recursive tree of the repository
  const { data } = await octokit.git.getTree({
    owner: "isomerpages",
    repo: site,
    tree_sha: useStagingBranch ? "staging" : "master",
    recursive: "1",
  });

  if (!Array.isArray(data.tree)) {
    console.error(
      "Unexpected data returned from GitHub API in getRecursiveTree"
    );
    return [];
  }

  // Filter out all pages that start with the specified path
  return data.tree
    .filter(
      (item) =>
        item.type === "blob" &&
        item.path.startsWith(path) &&
        item.path.endsWith(".md")
    )
    .map((item) => item.path);
};

// This function gets the file contents of a particular page
export const getFileContents = async ({
  site,
  path,
  octokit,
  useStagingBranch = false,
}: GetRepoPathContentsParams) => {
  // Get the file contents of the page
  try {
    const { data } = await octokit.repos.getContent({
      owner: "isomerpages",
      repo: site,
      path,
      ref: useStagingBranch ? "staging" : "master",
    });

    if (Array.isArray(data) || data.type !== "file") {
      console.error(
        "Unexpected data returned from GitHub API in getFileContents"
      );
      return null;
    }

    // Parse the content of the file
    return Buffer.from(data.content, "base64").toString("utf-8");
  } catch (error) {
    // Likely missing file or path
    console.error(`Error reading file contents at ${path}:`, error);
    return null;
  }
};
