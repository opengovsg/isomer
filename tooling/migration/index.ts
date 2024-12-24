import * as fs from "fs";
import _ from "lodash";
import { fileWriter } from "./writer";
import {
  extractCollectionPostName,
  isCollectionPost,
  getCollectionCategory,
  jekyllPost2CollectionPage,
  jekyllPage2CollectionPage,
  generateCollectionLink,
  parseCollectionDateFromString,
} from "./generate/collection";
import { generateCollectionInOutMapping } from "./migrate/collection";
import {
  addBlobToResource,
  createBlob,
  createResource,
  createVersion,
  getSanitisedAssetName,
} from "./utils";
import path from "path";
import { JekyllFile } from "./migrate/jekyll";
import pg from "pg";
import {
  copyToAssetsFolder,
  MigratablePagesWithMeta,
  migrateImages,
} from "./migrate/assets";
import { REPO_DIR } from "./constants";
import { generateAssetsPath } from "./migrate/utils";
import { generateFilesInOutMappings } from "./generate/files";

const { Client } = pg;
const OUTPUT_DIR = "output";

// const SITE_ID = 23; // NOTE: this is the mse site
const SITE_ID = 1;

const __dirname = path.resolve();

const extractLinks = (pages: MigratablePagesWithMeta[]) => {
  const seen: Record<string, string> = {};

  const files: MigratablePagesWithMeta[] = pages.map(
    ({ content, jsonOutpath, name }) => {
      const tiptapContent = content.content;

      const newContent = tiptapContent.map((component) => {
        if (component.type !== "prose") return component;

        const componentContent = component.content?.map((block) => {
          if (block.type !== "paragraph") return block;

          const blockContent = block.content?.map((text) => {
            if (text.type !== "text") return text;

            const marks = text.marks;
            const textMarks = marks?.map((mark) => {
              if (mark.type !== "link") return mark;

              const href = mark.attrs.href;
              if (!href?.startsWith("/")) return mark;

              if (seen[href]) {
                mark.attrs.href = seen[href];
                return mark;
              }

              const outpath = generateAssetsPath(SITE_ID, href);
              seen[href] = outpath;

              mark.attrs.href = outpath;
              return mark;
            });

            return { ...text, marks: textMarks };
          });

          return { ...block, content: blockContent };
        });

        return { ...component, content: componentContent };
      });

      return {
        jsonOutpath,
        content: { ...content, content: newContent },
        name,
      };
    },
  );

  return { seen, files };
};

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

// NOTE: walks the collection given by `dir`
// and seeds the items found within recursively
// into our database
export const walkAndSeedCollection = async (dir: string, siteId: number) => {
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
          const rawFile = fs.readFileSync(
            `${ent.parentPath}/${ent.name}`,
            "utf8",
          );

          const { blob, resource } = JSON.parse(rawFile);

          try {
            const id = await createResource(client, {
              ...resource,
              parentId,
              siteId,
            });

            if (blob) {
              const blobId = await createBlob(client, blob);
              await addBlobToResource(client, id, blobId);
              await createVersion(client, id, blobId);
            }
          } catch (e) {
            console.log(e);
            console.log("FAILED TO SEED: ", `${ent.parentPath}/${ent.name}`);
          }
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
  const mappings = generateCollectionInOutMapping(`${REPO_DIR}/news`);
  const filesToShift = generateFilesInOutMappings(`${REPO_DIR}/news`);

  fs.writeFileSync("migration.csv", `${JSON.stringify(mappings, null, 2)}`);

  // NOTE: permalink here refers to the original path of the file
  // that is in the `_site` directory after generation
  const fileRedirects = await Promise.all(
    filesToShift.map(async ({ path, title, permalink, date }) => {
      const assetsPath = generateAssetsPath(SITE_ID, permalink);
      // NOTE:  same function call that is used by `generateAssetsPath`
      const sanitisedName = getSanitisedAssetName(permalink);
      const category = getCollectionCategory(path.split("/").at(1)!);
      let assetDate: string;

      if (date) {
        const { year, month, day } = parseCollectionDateFromString(date);
        assetDate = `${day}/${month}/${year}`;
      } else {
        assetDate = new Date().toLocaleString("en-GB");
      }

      const collectionLink = generateCollectionLink({
        ref: assetsPath,
        date: assetDate,
        category,
      });

      // first, we copy the file over to our assets folder
      await copyToAssetsFolder(permalink, assetsPath);

      // TODO: Shift the writing of redirections out into its own function
      const dbPermalink = title!.replaceAll(/ /g, "-").toLowerCase();

      // next, we have to copy it over to our collection as well
      // so that it gets picked up later when we are seeding our database
      fileWriter.write({
        resource: {
          title: title ?? sanitisedName,
          permalink: dbPermalink,
          type: "CollectionLink",
        },
        blob: collectionLink,
        // NOTE: cheating abit because we know this ahead of time
        path: `${OUTPUT_DIR}/${sanitisedName}.json`,
      });

      // TODO: need a deterministic way of getting the redirects
      return { from: permalink, to: `latest-news/${dbPermalink}` };
    }),
  );

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

  fileRedirects.forEach(({ from, to }) => {
    fs.appendFileSync("redirects.csv", `${from},${to}\n`);
  });

  const files = filesToMigrate.map(({ inpath, outpath, ...rest }) => {
    fs.appendFileSync(
      "redirects.csv",
      `${outpath},${rest.content.page.permalink}\n`,
    );
    return rest;
  });

  const { seen: imagesMapping, files: filesWithMigratedImages } =
    await migrateImages(files, SITE_ID);

  const { seen: filesMapping, files: filesWithMigratedLinks } = extractLinks(
    filesWithMigratedImages,
  );

  filesWithMigratedLinks.map(({ jsonOutpath, name, content }) => {
    fileWriter.write({
      resource: {
        title: content.page.title,
        permalink: content.page.permalink,
        type: "CollectionPage",
      },
      blob: content,
      path: jsonOutpath,
    });
    return { jsonOutpath, content, name };
  });

  Object.entries(imagesMapping).map(([src, dest]) => {
    fs.appendFileSync("image_mappings.csv", `${src},${dest}\n`);
    return copyToAssetsFolder(src, dest);
  });

  Object.entries(filesMapping).map(([src, dest]) => {
    fs.appendFileSync("link_mappings.csv", `${src},${dest}\n`);
    return copyToAssetsFolder(src, dest);
  });

  await walkAndSeedCollection(OUTPUT_DIR, SITE_ID);
};

await main();
