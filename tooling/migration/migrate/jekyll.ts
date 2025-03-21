import fm from "front-matter";

const JEKYLL_FRONTMATTER_DELIMITER = "---";

export type JekyllFrontmatter = `---\n${string}\n---`;
export type JekyllFile = `${JekyllFrontmatter}\n${string}`;

export const extractPermalink = (content: JekyllFile) => {
  return extractFrontmatter(content).permalink;
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
  return fm(content).attributes as Record<string, string>;
};
