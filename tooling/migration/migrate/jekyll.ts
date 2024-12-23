const JEKYLL_FRONTMATTER_DELIMITER = "---";
const PERMALINK_TEXT = "permalink:";

export type JekyllFrontmatter = `---\n${string}\n---`;
export type JekyllPost = `${JekyllFrontmatter}\n${string}`;

export const extractPermalink = (content: JekyllPost) => {
  return content
    .split(JEKYLL_FRONTMATTER_DELIMITER)
    .at(1)
    ?.split("\n")
    .find((line) => line.startsWith(PERMALINK_TEXT))
    ?.replace(PERMALINK_TEXT, "")
    .trim();
};

export const extractContent = (content: JekyllPost) => {
  return content
    .split(JEKYLL_FRONTMATTER_DELIMITER)
    .slice(2)
    .join(JEKYLL_FRONTMATTER_DELIMITER)
    .trim();
};

export const extractFrontmatter = (
  content: JekyllPost,
): Record<string, string> => {
  const lines = content.split(JEKYLL_FRONTMATTER_DELIMITER).at(1)?.split("\n");
  const records = lines?.map((line) => line.split(":").map((x) => x.trim()));

  return Object.fromEntries(records ?? []);
};
