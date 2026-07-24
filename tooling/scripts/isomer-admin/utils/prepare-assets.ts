import crypto from "crypto";
import fs from "fs";
import path from "path";

import type { AssetsMap } from "../types";

const getFiles = (directory: string): string[] => {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((file) => {
    const fullPath = path.join(directory, file.name);

    if (file.isDirectory()) {
      return getFiles(fullPath);
    }

    if (file.name === ".keep") {
      return [];
    }

    return [fullPath];
  });
};

export const prepareAssets = ({
  siteId,
  inputDir,
  outputDir,
}: {
  siteId: string;
  inputDir: string;
  outputDir: string;
}): AssetsMap => {
  if (!fs.existsSync(inputDir)) {
    throw new Error(`Assets input directory not found: ${inputDir}`);
  }

  const imagesDir = path.join(inputDir, "images");
  const filesDir = path.join(inputDir, "files");
  const hasV1Layout =
    fs.existsSync(imagesDir) || fs.existsSync(filesDir);

  const assetsMap: AssetsMap = {};

  if (hasV1Layout) {
    const assetGroups = [
      { root: imagesDir, prefix: "images" },
      { root: filesDir, prefix: "files" },
    ];

    for (const { root, prefix } of assetGroups) {
      for (const filePath of getFiles(root)) {
        copyAssetToOutput({
          siteId,
          outputDir,
          asset: path.join(prefix, path.relative(root, filePath)),
          sourcePath: filePath,
          assetsMap,
        });
      }
    }
  } else {
    const flatFiles = fs
      .readdirSync(inputDir, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name);

    if (flatFiles.length === 0) {
      throw new Error(
        `No asset files found in ${inputDir}. Add files directly, or use images/ and files/ subfolders.`,
      );
    }

    for (const file of flatFiles) {
      copyAssetToOutput({
        siteId,
        outputDir,
        asset: path.join("images", file),
        sourcePath: path.join(inputDir, file),
        assetsMap,
      });
    }
  }

  if (Object.keys(assetsMap).length === 0) {
    throw new Error(`No asset files found in ${inputDir}`);
  }

  return assetsMap;
};

const copyAssetToOutput = ({
  siteId,
  outputDir,
  asset,
  sourcePath,
  assetsMap,
}: {
  siteId: string;
  outputDir: string;
  asset: string;
  sourcePath: string;
  assetsMap: AssetsMap;
}): void => {
  const assetName = path.basename(asset);
  const uuid = crypto.randomUUID();
  const outputPath = path.join(outputDir, siteId, uuid, assetName);
  const newAssetPath = `/${siteId}/${uuid}/${assetName}`;
  const originalAssetPath = `/${asset.replaceAll(path.sep, "/")}`;

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.copyFileSync(sourcePath, outputPath);

  assetsMap[originalAssetPath] = newAssetPath;
  console.log(`Prepared asset: ${originalAssetPath} → ${newAssetPath}`);
};

export const writeAssetMappingCsv = ({
  siteId,
  assetsMap,
  outputPath,
}: {
  siteId: string;
  assetsMap: AssetsMap;
  outputPath?: string;
}): string => {
  const csvFilePath = outputPath ?? `${siteId}-file-mapping.csv`;
  const csvHeader = `"Original Path","New File Path"`;
  const csvContent = Object.entries(assetsMap)
    .map(([originalPath, newFilePath]) => `"${originalPath}","${newFilePath}"`)
    .join("\n");

  fs.writeFileSync(csvFilePath, `${csvHeader}\n${csvContent}`);
  return csvFilePath;
};
