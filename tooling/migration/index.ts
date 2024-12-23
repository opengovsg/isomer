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
import {
  extractContent,
  extractFrontmatter,
  JekyllPost,
} from "./migrate/jekyll";
import pg from "pg";
import {
  ArticlePageSchemaType,
  IsomerComponent,
  IsomerPageLayoutType,
  IsomerPageSchemaType,
} from "@opengovsg/isomer-components";
import { error } from "console";

const { Client } = pg;
const md = markdownit({ html: true });

const OUTPUT_DIR = "output";

// const SITE_ID = 23; // NOTE: this is the mse site
const SITE_ID = 1;
const DEBUG = false;
const LIMIT = 50;

const __dirname = path.resolve();
// NOTE: This is the path to migrate
const migrate = async (
  mappings: MigrationMapping,
  ghDir: string,
  writers: Writer[],
) => {
  const writtenFiles = await Promise.all(
    Object.entries(mappings).map(async ([outpath, inpath], index) => {
      // if (DEBUG && index <= LIMIT) {
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
          category: _.upperFirst(trimNonAlphaNum(category)).replaceAll(
            /[^a-zA-Z0-9]+/g,
            " ",
          ),
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
          category: _.upperFirst(trimNonAlphaNum(category)).replaceAll(
            /[^a-zA-Z0-9]+/g,
            " ",
          ),
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
      // }
    }),
  );

  return writtenFiles;
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

export const migrateAssets = async (writtenFiles: string[], siteId: number) => {
  const seen: Record<string, string> = {};

  writtenFiles.map(async (filename) => {
    const schema: ArticlePageSchemaType = JSON.parse(
      fs.readFileSync(filename, "utf8"),
    );

    const { content } = schema;

    const newContent = await Promise.all(
      content.map(async (block) => {
        if (block.type !== "image") return block;

        const { src, alt: oldAlt, ...rest } = block;
        const alt = oldAlt ?? "This is an example alt text for an image";
        // NOTE: Not a local image, no need to migrate
        if (!src.startsWith("/")) return { src, alt, ...rest };

        if (seen[src]) {
          return { src: seen[src], alt, ...rest };
        } else {
          const sanitisedName = getSanitisedAssetName(src);
          const uuid = crypto.randomUUID();
          const outpath = `/${siteId}/${uuid}/${sanitisedName}`;
          console.log("OUT", outpath);
          const parentPath = outpath.split("/").slice(0, -1).join("/");
          await mkdirp(__dirname + parentPath);

          await copyFile(`${__dirname}/_site${src}`, `${__dirname}${outpath}`);

          console.log("BEFORE", block.src);
          console.log("AFTER", outpath);
          seen[src] = outpath;

          return { src: outpath, alt, ...rest };
        }
      }),
    );

    schema.content = newContent;
    // NOTE: Write back to same file
    fs.writeFileSync(filename, JSON.stringify(schema, null, 2));
  });

  return writtenFiles;
};

const mappings = generateCollectionInOutMapping("_repo/news");
const assetsMapping = await generateAssets("_images", SITE_ID);

const writtenFiles = await migrate(mappings, "_repo/news", [fileWriter]);
await migrateAssets(writtenFiles, SITE_ID);

await walk(OUTPUT_DIR, SITE_ID);
