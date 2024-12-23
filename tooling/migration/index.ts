import * as fs from "fs";
import _ from "lodash";
import { fileWriter } from "./writer";
import {
  extractCollectionPostName,
  isCollectionPost,
  getCollectionCategory,
  jekyllPost2CollectionPage,
  jekyllPage2CollectionPage,
} from "./generate/collection";
import { generateCollectionInOutMapping } from "./migrate/collection";
import { addBlobToResource, createBlob, createResource } from "./utils";
import path from "path";
import { JekyllFile } from "./migrate/jekyll";
import pg from "pg";
import { copyToAssetsFolder, migrateAssets } from "./migrate/assets";
import { REPO_DIR } from "./constants";

const { Client } = pg;
const OUTPUT_DIR = "output";

// const SITE_ID = 23; // NOTE: this is the mse site
const SITE_ID = 1;

const __dirname = path.resolve();

interface MigrationFileMeta {
  inpath: string;
  outpath: string;
  mdContent: JekyllFile;
}
const migrateCollection = async (
  migrationFiles: MigrationFileMeta[],
  // NOTE: This is the github collection to migrate
  ghDir: string,
) => {
  return Promise.all(
    migrationFiles.map(async ({ inpath, outpath, mdContent }) => {
      const hasTerminatingSlash = outpath.endsWith("/");

      const nameIndex = hasTerminatingSlash ? -2 : -1;
      const name = outpath.split("/").at(nameIndex)!;

      // NOTE: indir assumed to not have terminating slash here
      const category = getCollectionCategory(
        inpath.replace(ghDir, "").split("/").at(1)!,
      );

      const destinationFileName = isCollectionPost(name)
        ? extractCollectionPostName(name)
        : name;
      const content = isCollectionPost(name)
        ? await jekyllPost2CollectionPage(name, mdContent, category)
        : await jekyllPage2CollectionPage(name, mdContent, category);

      const jsonOutpath = `${__dirname}/${OUTPUT_DIR}/${destinationFileName}.json`;
      return { inpath, outpath, jsonOutpath, content, name };
    }),
  );
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
    title: "Latest news",
    permalink: "latest-news",
    type: "Collection",
    siteId,
  });
  await _walk(dir, rootId);
  await client.end();
  return rootId;
};

const main = async () => {
  // const collections = getCollectionsFromConfig();
  // const folders = getFolders()
  const mappings = generateCollectionInOutMapping(`${REPO_DIR}/news`);

  const fileContents: MigrationFileMeta[] = await Promise.all(
    Object.entries(mappings).map(async ([outpath, inpath]) => {
      const mdContent = fs.readFileSync(inpath, "utf-8") as JekyllFile;
      return { mdContent, outpath, inpath };
    }),
  );

  const filesToMigrate = await migrateCollection(
    fileContents,
    `${REPO_DIR}/news`,
  );
  const files = filesToMigrate.map(({ inpath, outpath, ...rest }) => {
    fs.appendFileSync("mappings.csv", `${inpath},${outpath}\n`);
    return rest;
  });

  const { seen, files: rewrittenFiles } = await migrateAssets(files, SITE_ID);

  rewrittenFiles.map(({ jsonOutpath, name, content }) => {
    fileWriter.write(name, jsonOutpath, JSON.stringify(content, null, 2));
    return { jsonOutpath, content, name };
  });

  Object.entries(seen).map(([src, dest]) => {
    fs.appendFileSync("asset_mappings.csv", `${src},${dest}\n`);
    return copyToAssetsFolder(src, dest);
  });

  await walk(OUTPUT_DIR, SITE_ID);
};

await main();
