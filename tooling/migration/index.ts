import * as fs from "fs";
import _ from "lodash";
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
  CollectionPageName,
  getCollectionCategory,
} from "./generate/collection";
import { generateCollectionInOutMapping } from "./migrate/collection";
import { MigrationMapping } from "./types/migration";
import markdownit from "markdown-it";
import { addBlobToResource, createBlob, createResource } from "./utils";
import path from "path";
import {
  extractContent,
  extractFrontmatter,
  JekyllPost,
} from "./migrate/jekyll";
import pg from "pg";
import { migrateAssets } from "./migrate/assets";

const { Client } = pg;
const md = markdownit({ html: true });

const OUTPUT_DIR = "output";

// const SITE_ID = 23; // NOTE: this is the mse site
const SITE_ID = 1;

const __dirname = path.resolve();
// NOTE: This is the path to migrate
const migrate = async (
  mappings: MigrationMapping,
  ghDir: string,
  writers: Writer[],
) => {
  const writtenFiles = await Promise.all(
    Object.entries(mappings).map(async ([outpath, inpath]) => {
      const hasTerminatingSlash = outpath.endsWith("/");
      const mdContent = fs.readFileSync(inpath, "utf-8") as JekyllPost;
      const frontmatter = extractFrontmatter(mdContent);
      const jekyllContent = extractContent(mdContent);

      const html = md.render(jekyllContent);

      const nameIndex = hasTerminatingSlash ? -2 : -1;
      const name = outpath.split("/").at(nameIndex)!;

      const output = await html2schema(html, "");

      // NOTE: indir assumed to not have terminating slash here
      const category = inpath.replace(ghDir, "").split("/").at(1)!;

      if (isCollectionPost(name)) {
        const { year, month, day } = parseCollectionDateFromFileName(name);
        const lastModified = `${day}/${month}/${year}`;
        const rawCollectionFileName = extractCollectionPostName(name);

        const content = generateCollectionArticlePage({
          category: getCollectionCategory(category),
          title:
            (frontmatter.title as CollectionPageName) ??
            getCollectionPageNameFromPost(rawCollectionFileName),
          permalink: rawCollectionFileName,
          content: output,
          lastModified,
        });

        const jsonOutpath = `${__dirname}/${OUTPUT_DIR}/${rawCollectionFileName}.json`;

        await Promise.all(
          writers.map(async (writer) => {
            await writer.write(
              name,
              jsonOutpath,
              JSON.stringify(content, null, 2),
            );
          }),
        );

        return jsonOutpath;
      } else {
        const lastModified = new Date().toLocaleDateString("en-GB");
        const title =
          (frontmatter.title as CollectionPageName) ??
          getCollectionPageNameFromPage(name);

        const content = generateCollectionArticlePage({
          category: getCollectionCategory(category),
          title,
          permalink: title.replaceAll(/ /g, "-").toLowerCase(),
          content: output,
          lastModified,
        });

        const jsonOutpath = `${__dirname}/${OUTPUT_DIR}/${name}.json`;

        await Promise.all(
          writers.map(async (writer) => {
            await writer.write(
              name,
              jsonOutpath,
              JSON.stringify(content, null, 2),
            );
          }),
        );

        return jsonOutpath;
      }
    }),
  );

  return writtenFiles;
};

export const walk = async (dir: string, siteId: number) => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();

  // create db entries
  const _walk = async (dir: string, parentId: number) => {
    const dirEnt = fs.readdirSync(dir, { withFileTypes: true });

    await Promise.all(
      dirEnt.map(async (ent) => {
        if (ent.isDirectory()) {
          // NOTE: Collection is the only one we are doing for now
          const id = await createResource(client, {
            title: ent.name.replaceAll(/[^a-zA-Z0-9]*/g, ""),
            permalink: ent.name.replaceAll(/[^a-zA-Z0-9-]+/g, "-"),
            parentId,
            type: "Collection",
            siteId,
          });

          await _walk(`${dir}/${ent.name}`, id);
        } else {
          if (ent.name.startsWith("_") || ent.name.startsWith(".")) return;
          const blob = fs.readFileSync(`${ent.parentPath}/${ent.name}`, "utf8");
          const parsed = JSON.parse(blob);
          const { page } = parsed;

          const id = await createResource(client, {
            ...page,
            parentId,
            type: "CollectionPage",
            siteId,
          });

          const blobId = await createBlob(client, parsed);
          await addBlobToResource(client, id, blobId);
        }
      }),
    );
  };

  const rootId = await createResource(client, {
    parentId: null,
    title: "Latest News",
    permalink: "latest-news",
    type: "Collection",
    siteId,
  });
  await _walk(dir, rootId);
  await client.end();
  return rootId;
};

const mappings = generateCollectionInOutMapping("_repo/news");

const writtenFiles = await migrate(mappings, "_repo/news", [fileWriter]);
await migrateAssets(writtenFiles, SITE_ID);

await walk(OUTPUT_DIR, SITE_ID);
