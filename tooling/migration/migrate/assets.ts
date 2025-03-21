import {
  ArticlePageSchemaType,
  ContentPageSchemaType,
} from "@opengovsg/isomer-components";
import { copyFile } from "node:fs/promises";
import { mkdirp } from "mkdirp";
import path from "node:path";
import { WithoutSite } from "~/types/pages";
import { SITE_DIR } from "~/constants";
import { generateAssetsPath } from "./utils";

const __dirname = path.resolve();

export type MigratablePages =
  | WithoutSite<ArticlePageSchemaType>
  | WithoutSite<ContentPageSchemaType>;

export interface MigratablePagesWithMeta {
  jsonOutpath: string;
  content: MigratablePages;
  name: string;
}
export const migrateImages = async (
  files: MigratablePagesWithMeta[],
  siteId: number,
) => {
  const seen: Record<string, string> = {};

  const rewrittenFiles = files.map(({ content: schema, ...rest }) => {
    const { content } = schema;

    // NOTE: this assumes that the images have been shifted to top level
    const newContent = content.map((block) => {
      if (block.type !== "image") return block;

      const { src, alt: oldAlt, ...rest } = block;
      const alt = oldAlt ?? "This is an example alt text for an image";
      // NOTE: Not a local image, no need to migrate
      if (!src.startsWith("/")) return { src, alt, ...rest };

      if (seen[src]) {
        return { src: seen[src], alt, ...rest };
      } else {
        const outpath = generateAssetsPath(siteId, src);

        seen[src] = outpath;

        return { src: outpath, alt, ...rest };
      }
    });

    schema.content = newContent;

    return { content: schema, ...rest };
  });

  return { seen, files: rewrittenFiles };
};

// NOTE: This copies a file at `from` into a `to`
// and returns the path.
// IMPORTANT: this assumes that `from` is rooted at `SITE_DIR`
export const copyToAssetsFolder = async (
  from: string,
  to: string,
): Promise<string> => {
  const _from = `${__dirname}/${SITE_DIR}${decodeURIComponent(from)}`;
  const _to = `${__dirname}${decodeURIComponent(to)}`;

  try {
    await copy(_from, _to);

    return _to;
  } catch (e) {
    console.error(e);
    return `ERROR: ${_from} skipped, error message was: ${e.message}`;
  }
};

export const copy = async (from: string, to: string) => {
  const parentPath = to.split("/").slice(0, -1).join("/");

  await mkdirp(parentPath);
  await copyFile(from, to);

  return to;
};
