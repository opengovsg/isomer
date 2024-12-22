import * as fs from "fs";
import { Writer } from "./types/writer";
import { fileWriter } from "./writer";
import { html2schema } from "./migrate/html2schema";
import {
  getCollectionPageNameFromPage,
  extractCollectionPostName,
  generateCollectionArticlePage,
  getCollectionPageNameFromPost,
  isCollectionPost,
  parseCollectionDateFromFileName,
  trimNonAlphaNum,
} from "./generate/collection";
import { generateCollectionInOutMapping } from "./migrate/collection";
import { MigrationMapping } from "./types/migration";
import markdownit from "markdown-it";

const md = markdownit();

const OUTPUT_DIR = "output/news";

const SITE_ID = 23; // NOTE: this is the mse site

// NOTE: This is the path to migrate
const migrate = async (
  mappings: MigrationMapping,
  ghDir: string,
  writers: Writer[],
) => {
  Object.entries(mappings).forEach(async ([outpath, inpath], index) => {
    if (index <= 1) {
      const hasTerminatingSlash = outpath.endsWith("/");

      const html = md.render(fs.readFileSync(inpath, "utf-8"));
      const nameIndex = hasTerminatingSlash ? -2 : -1;
      const name = outpath.split("/").at(nameIndex)!;

      const output = await html2schema(html, "news/news-images");
      // NOTE: indir assumed to not have terminating slash here
      const category = inpath.replace(ghDir, "").split("/").at(1)!;

      if (isCollectionPost(name)) {
        const { year, month, day } = parseCollectionDateFromFileName(name);
        const lastModified = `${year}-${month}-${day}`;
        const rawCollectionFileName = extractCollectionPostName(name);

        const content = generateCollectionArticlePage({
          category: trimNonAlphaNum(category),
          title: getCollectionPageNameFromPost(rawCollectionFileName),
          permalink: rawCollectionFileName,
          content: output,
          lastModified,
        });

        const jsonOutpath = `${__dirname}/${OUTPUT_DIR}/${rawCollectionFileName}.json`;

        writers.map((writer) => {
          writer.write(name, jsonOutpath, JSON.stringify(content, null, 2));
        });
      } else {
        const lastModified = new Date().toISOString();
        const title = getCollectionPageNameFromPage(name);
        const content = generateCollectionArticlePage({
          category: trimNonAlphaNum(category),
          title,
          permalink: title.replaceAll(/ /g, "-").toLowerCase(),
          content: output,
          lastModified,
        });

        const jsonOutpath = `${__dirname}/${OUTPUT_DIR}/${name}.json`;

        writers.map((writer) => {
          writer.write(name, jsonOutpath, JSON.stringify(content, null, 2));
        });
      }
    }
  });
};

const mappings = generateCollectionInOutMapping("_repo/news");
migrate(mappings, "_repo/news", [fileWriter]);
