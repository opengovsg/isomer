import * as fs from "fs";
import _ from "lodash";
import { copyFile } from "node:fs/promises";
import { Writer } from "./types/writer";
import { fileWriter } from "./writer";
import { html2schema, updateImageSrc } from "./migrate/html2schema";
import {
  getCollectionPageNameFromPage,
  extractCollectionPostName,
  generateCollectionArticlePage,
  getCollectionPageNameFromPost,
  isCollectionPost,
  parseCollectionDateFromFileName,
  trimNonAlphaNum,
  CollectionPageName,
} from "./generate/collection";
import { generateCollectionInOutMapping } from "./migrate/collection";
import { MigrationMapping } from "./types/migration";
import markdownit from "markdown-it";
import {
  addBlobToResource,
  createBlob,
  createResource,
  getSanitisedAssetName,
  readAllFiles,
} from "./utils";
import { mkdirp } from "mkdirp";
import path from "path";
import { extractFrontmatter, JekyllPost } from "./migrate/jekyll";
import pg from "pg";

const { Client } = pg;
const md = markdownit({ html: true });

const OUTPUT_DIR = "output";

const SITE_ID = 23; // NOTE: this is the mse site

const __dirname = path.resolve();
// NOTE: This is the path to migrate
const migrate = async (
  mappings: MigrationMapping,
  ghDir: string,
  writers: Writer[],
  assetsMapping: Record<string, string>,
) => {
  Object.entries(mappings).forEach(async ([outpath, inpath], index) => {
    if (index <= 50) {
      const hasTerminatingSlash = outpath.endsWith("/");
      const mdContent = fs.readFileSync(inpath, "utf-8") as JekyllPost;
      const frontmatter = extractFrontmatter(mdContent);

      const html = md.render(mdContent);

      const nameIndex = hasTerminatingSlash ? -2 : -1;
      const name = outpath.split("/").at(nameIndex)!;

      const schema = await html2schema(html, "news/news-images");
      const output = updateImageSrc(schema, assetsMapping, "/news/news-images");
      // NOTE: indir assumed to not have terminating slash here
      const category = inpath.replace(ghDir, "").split("/").at(1)!;

      if (isCollectionPost(name)) {
        const { year, month, day } = parseCollectionDateFromFileName(name);
        const lastModified = `${day}/${month}/${year}`;
        const rawCollectionFileName = extractCollectionPostName(name);

        const content = generateCollectionArticlePage({
          category: _.upperFirst(trimNonAlphaNum(category)),
          title:
            (frontmatter.title as CollectionPageName) ??
            getCollectionPageNameFromPost(rawCollectionFileName),
          permalink: rawCollectionFileName,
          content: output,
          lastModified,
        });

        const jsonOutpath = `${__dirname}/${OUTPUT_DIR}/${rawCollectionFileName}.json`;
        console.log("post", jsonOutpath);

        writers.map((writer) => {
          writer.write(name, jsonOutpath, JSON.stringify(content, null, 2));
        });
      } else {
        const lastModified = new Date().toLocaleDateString("en-GB");
        const title =
          (frontmatter.title as CollectionPageName) ??
          getCollectionPageNameFromPage(name);

        const content = generateCollectionArticlePage({
          category: _.upperFirst(trimNonAlphaNum(category)),
          title,
          permalink: title.replaceAll(/ /g, "-").toLowerCase(),
          content: output,
          lastModified,
        });

        const jsonOutpath = `${__dirname}/${OUTPUT_DIR}/${name}.json`;
        console.log("page", jsonOutpath);

        writers.map((writer) => {
          writer.write(name, jsonOutpath, JSON.stringify(content, null, 2));
        });
      }
    }
  });
};

// NOTE: structure is site id -> uuid -> filename, where filename has NO SLASHES
const generateAssets = async (assetsPath: string, siteId: number) => {
  const assets = readAllFiles(assetsPath);
  const assetsMapping: Record<string, string> = {};

  await Promise.all(
    assets.map(async (fullName) => {
      const sanitisedName = getSanitisedAssetName(fullName.split("/").at(-1)!);
      const uuid = crypto.randomUUID();
      const outpath = `./${siteId}/${uuid}/${sanitisedName}`;
      const parentPath = outpath.split("/").slice(0, -1).join("/");
      await mkdirp(parentPath);

      await copyFile(fullName, outpath);
      const initialAssetsPath = fullName.replace(assetsPath, "");
      // NOTE: get rid of the leading `.`
      assetsMapping[initialAssetsPath] = outpath.slice(1);
    }),
  );

  return assetsMapping;
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
        console.log("processing", ent.name);
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
    title: "Root",
    permalink: "root",
    type: "Folder",
    siteId,
  });
  await _walk(dir, rootId);
  await client.end();
  return rootId;
};

const mappings = generateCollectionInOutMapping("_repo/news");
const assetsMapping = await generateAssets("_images", SITE_ID);

await migrate(mappings, "_repo/news", [fileWriter], assetsMapping);
await walk(OUTPUT_DIR, 1);
