import { ArticlePageSchemaType } from "@opengovsg/isomer-components";
import { copyFile } from "node:fs/promises";
import * as fs from "fs";
import { mkdirp } from "mkdirp";
import { getSanitisedAssetName } from "~/utils";

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
          const parentPath = outpath.split("/").slice(0, -1).join("/");
          await mkdirp(__dirname + parentPath);

          await copyFile(`${__dirname}/_site${src}`, `${__dirname}${outpath}`);

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
