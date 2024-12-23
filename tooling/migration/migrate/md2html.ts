import markdownit from "markdown-it";

const md = markdownit({ html: true });
export const md2html = (mdString: string) => {
  return md.render(mdString);
};
