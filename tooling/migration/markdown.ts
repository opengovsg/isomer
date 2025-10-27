import MarkdownIt from "markdown-it";
import fm from "front-matter";

export const getHtmlFromMarkdown = (markdown: string) => {
  let frontmatter: any = {};
  const md = new MarkdownIt({ html: true });

  // Remove frontmatter before rendering
  const markdownWithoutFrontmatter = markdown.replace(/---[\s\S]*?---/gm, "");

  const html = md.render(markdownWithoutFrontmatter);
  try {
    frontmatter = fm(markdown).attributes as any;
  } catch (e) {
    // Handle case where frontmatter has duplicate keys
    // Extract the frontmatter manually
    const frontmatterMatch = markdown.match(/---([\s\S]*?)---/);
    if (frontmatterMatch) {
      const frontmatterContent = frontmatterMatch[1]!;
      frontmatterContent.split("\n").forEach((line) => {
        const [key, ...rest] = line.split(":");
        if (key && rest.length > 0) {
          // Remove any leading/trailing quotes and whitespace from the value
          const value = rest
            .join(":")
            .trim()
            .replace(/^["']|["']$/g, "");
          frontmatter[key.trim()] = value;
        }
      });
    }
  }

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
