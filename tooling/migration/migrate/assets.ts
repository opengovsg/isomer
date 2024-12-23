import {
  ArticlePageSchemaType,
  ContentPageSchemaType,
} from "@opengovsg/isomer-components";
import { copyFile } from "node:fs/promises";
import { mkdirp } from "mkdirp";
import { getSanitisedAssetName } from "~/utils";
import path from "node:path";
import { WithoutSite } from "~/types/pages";
import { SITE_DIR } from "~/constants";

const __dirname = path.resolve();

type MigratablePages =
  | WithoutSite<ArticlePageSchemaType>
  | WithoutSite<ContentPageSchemaType>;

interface MigratablePagesWithMeta {
  jsonOutpath: string;
  content: MigratablePages;
  name: string;
}
export const migrateAssets = async (
  files: MigratablePagesWithMeta[],
  siteId: number,
) => {
  const seen: Record<string, string> = {};

  const rewrittenFiles = files.map(({ content: schema, ...rest }) => {
    const { content } = schema;

    const newContent = content.map((block) => {
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
// and returns the path
export const copyToAssetsFolder = async (
  from: string,
  to: string,
): Promise<string> => {
  const parentPath = to.split("/").slice(0, -1).join("/");

  await mkdirp(__dirname + parentPath);
  await copyFile(`${__dirname}/${SITE_DIR}${from}`, `${__dirname}${to}`);

  return to;
};
