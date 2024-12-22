import * as fs from "fs";
import { Tagged } from "type-fest";
import { MigrationMapping } from "~/types/migration";
import { readAllNonIndexFiles } from "~/utils";
import { extractPermalink, JekyllPost } from "./jekyll";

// NOTE: this reads in a collection and generates a mapping
// of the relative path of this file to its output permalink
export const generateCollectionInOutMapping = (pathToCollection: string) => {
  const kvStore = readAllNonIndexFiles(pathToCollection)
    .filter((path) => !path.endsWith("/index.html") && path.endsWith(".md"))
    .map((path) => ({
      path,
      content: fs.readFileSync(path, "utf-8") as JekyllPost,
    }))
    .map(({ path, content }) => [extractPermalink(content), path]);

  // NOTE: returns a mapping of outdir -> original path
  return Object.fromEntries(kvStore) as MigrationMapping;
};
