import MarkdownIt from "markdown-it";
import fm from "front-matter";

export const getHtmlFromMarkdown = (markdown: string) => {
  const md = new MarkdownIt({ html: true });

  // Remove frontmatter before rendering
  const markdownWithoutFrontmatter = markdown.replace(/---[\s\S]*?---/gm, "");

  const html = md.render(markdownWithoutFrontmatter);
  const frontmatter = fm(markdown).attributes as any;

  return {
    title: frontmatter.title || "Page title",
    permalink: frontmatter.permalink,
    description: frontmatter.description, // Optional
    third_nav_title: frontmatter.third_nav_title, // Optional
    variant: frontmatter.variant || "markdown",
    image: frontmatter.image, // Optional
    layout: frontmatter.layout, // Optional, only used in resource room, post/link/file
    date: frontmatter.date, // Optional, only used in resource room
    ref: frontmatter.external || frontmatter.file_url, // Optional, only used for link/file
    html,
  };
};
