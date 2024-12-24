const JEKYLL_FRONTMATTER_DELIMITER = "---";
const PERMALINK_TEXT = "permalink:";

export type JekyllFrontmatter = `---\n${string}\n---`;
export type JekyllFile = `${JekyllFrontmatter}\n${string}`;

export const extractPermalink = (content: JekyllFile) => {
  return content
    .split(JEKYLL_FRONTMATTER_DELIMITER)
    .at(1)
    ?.split("\n")
    .find((line) => line.startsWith(PERMALINK_TEXT))
    ?.replace(PERMALINK_TEXT, "")
    .trim();
};

export const extractContent = (content: JekyllFile) => {
  return content
    .split(JEKYLL_FRONTMATTER_DELIMITER)
    .slice(2)
    .join(JEKYLL_FRONTMATTER_DELIMITER)
    .trim();
};

export const extractFrontmatter = (
  content: JekyllFile,
): Record<string, string> => {
  const lines = content.split(JEKYLL_FRONTMATTER_DELIMITER).at(1)?.split("\n");
  const records = lines
    ?.map((line) => line.split(":").map((x) => x.trim()))
    // NOTE: make sure a value exists for the given item in the frontmatter
    .filter(([, v]) => !!v);

  return Object.fromEntries(records ?? []);
};
