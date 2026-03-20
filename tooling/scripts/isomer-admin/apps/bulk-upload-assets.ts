import crypto from "crypto";
import fs from "fs";
import { input, confirm } from "@inquirer/prompts";

export const bulkUploadAssets = async () => {
  const siteId = await input({
    message: "Enter the site ID to upload assets for",
  });

  const hasPlacedFiles = await confirm({
    message:
      "Have you placed all the files you need inside the `./input` folder?",
    default: true,
  });

  if (!hasPlacedFiles) {
    console.log("Please place the files in the `./input` folder first, then try again.");
    return;
  }

  const inputFolder = "./input";
  const outputFolder = "./output";
  const files = fs.readdirSync(inputFolder);
  const fileMapping: Record<string, string> = {};

  for (const file of files) {
    const filePath = `${inputFolder}/${file}`;
    const uuid = crypto.randomUUID();
    const newFilePath = `/${siteId}/${uuid}/${file}`;
    const outputPath = `${outputFolder}${newFilePath}`;

    if (!fs.existsSync(`${outputFolder}/${siteId}/${uuid}`)) {
      fs.mkdirSync(`${outputFolder}/${siteId}/${uuid}`, { recursive: true });
    }

    fileMapping[file] = newFilePath;
    fs.copyFileSync(filePath, outputPath);
    console.log(`Saved ${file}`);
  }

  const csvFilePath = `${siteId}-file-mapping.csv`;
  const csvContent = Object.entries(fileMapping)
    .map(
      ([originalFileName, newFilePath]) =>
        `"${originalFileName}","${newFilePath}"`
    )
    .join("\n");
  const csvHeader = `"Original File Name","New File Path"`;
  const csvContentWithHeader = `${csvHeader}\n${csvContent}`;
  fs.writeFileSync(csvFilePath, csvContentWithHeader);

  console.log("Done! Upload the assets to the assets S3 bucket.");
};
