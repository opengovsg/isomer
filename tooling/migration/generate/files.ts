import * as fs from "fs";
import { JekyllFile, extractFrontmatter } from "~/migrate/jekyll";
import { readAllFiles } from "~/utils";

const hasValidFileUrl = (fileUrl?: string): boolean => {
  return !!fileUrl?.startsWith("/");
};

const hasValidLayout = (layout?: string): boolean => {
  return layout === "file";
};

const isValidFile = (frontMatter: Record<string, string>): boolean => {
  return (
    hasValidFileUrl(frontMatter["file_url"]) ||
    hasValidLayout(frontMatter["layout"])
  );
};

export const generateFilesInOutMappings = (path: string) => {
  return readAllFiles(path)
    .filter((path) => !path.endsWith("/index.html") && path.endsWith(".md"))
    .map((path) => ({
      path,
      content: fs.readFileSync(path, "utf-8") as JekyllFile,
    }))
    .map(({ path, content }) => {
      const frontmatter = extractFrontmatter(content);
      if (hasValidFileUrl(frontmatter["file_url"])) {
        console.log(frontmatter);
        return {
          title: frontmatter["title"],
          date: frontmatter["date"],
          permalink: frontmatter["file_url"]!,
          path,
        };
      }
    })
    .filter((x) => !!x);
};
