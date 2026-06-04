import * as fs from "fs";
import * as path from "path";
import { input, number } from "@inquirer/prompts";

import { graftFolder } from "./classic-migration/studiofier/graft";

export const graftFolderIntoSite = async () => {
  console.log("Graft a folder of Studio-format JSON into an existing site.");

  const siteId = await number({
    message: "Site ID (Studio Site.id):",
    required: true,
    validate: (v) => (v !== undefined && v > 0) || "Must be a positive integer",
  });
  const parentId = await number({
    message:
      "Parent Resource ID (id of the existing Folder/Collection to graft under):",
    required: true,
    validate: (v) => (v !== undefined && v > 0) || "Must be a positive integer",
  });
  const sourceDirRaw = await input({
    message: "Absolute path to the source folder on disk:",
    validate: (v) =>
      path.isAbsolute(v) || "Must be an absolute path (starts with /)",
  });
  const sourceDir = path.resolve(sourceDirRaw);
  if (!fs.existsSync(sourceDir) || !fs.statSync(sourceDir).isDirectory()) {
    throw new Error(`Not a directory: ${sourceDir}`);
  }

  await graftFolder({
    siteId: siteId!,
    parentId: parentId!,
    sourceDir,
  });
};
