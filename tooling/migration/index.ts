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
const OUTPUT_DIR = "output";

const SITE_ID = 23; // NOTE: this is the mse site

// NOTE: This is the path to migrate
const migrate = async (
  mappings: MigrationMapping,
  outdir: string,
  indir: string,
  writers: Writer[],
) => {
  Object.entries(mappings).forEach(async ([outpath, inpath], index) => {
    if (index <= 10) {
      const hasTerminatingSlash = outpath.endsWith("/");
      const basePath = `${outdir}${outpath}`;
      const filename = hasTerminatingSlash ? "index.html" : ".html";

      const html = fs.readFileSync(`${basePath}${filename}`, "utf-8");
      const nameIndex = hasTerminatingSlash ? -2 : -1;
      const name = outpath.split("/").at(nameIndex)!;

      const output = await html2schema(html, "news-images");
      // NOTE: indir assumed to not have terminating slash here
      const category = inpath.replace(indir, "").split("/").at(1)!;

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

        const jsonOutpath = `${__dirname}/${OUTPUT_DIR}/${name.replaceAll(/\.html$/g, ".json")}`;

        console.log(jsonOutpath, name);
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

        const jsonOutpath = `${__dirname}/${OUTPUT_DIR}/${name.replace(/\.html$/g, ".json")}`;
        console.log(jsonOutpath);

        writers.map((writer) => {
          writer.write(name, jsonOutpath, JSON.stringify(content, null, 2));
        });
      }
    }
  });
};

const mappings = generateCollectionInOutMapping("_repo/news");
migrate(mappings, "_site", "_repo/news", [fileWriter]);
