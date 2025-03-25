/**
 * Unlighthouse CI Runner
 * Simple script to run Unlighthouse CI for predefined sites
 *
 * Usage:
 * - npx index.ts
 */

import { execSync } from "child_process";
import * as path from "path";
import { OUTPUT_DIRECTORY, SITES_FILE } from "../constants";
import { Site } from "../types";
import { loadSitesFromCSV } from "../utils/loadSitesFromCsv";

// Load sites from CSV file
const csvFilePath = path.resolve(__dirname, `../${SITES_FILE}`);
const SITES: Site[] = loadSitesFromCSV(csvFilePath);

if (SITES.length === 0) {
  console.error("No sites found in CSV file. Please check the file format.");
  process.exit(1);
}

/**
 * Runs Unlighthouse CI for the given site name and URL
 */
function runUnlighthouseCI(site: Site): void {
  console.log(
    `\n--- Running Unlighthouse CI for site "${site.name}" with URL "${site.url}" ---\n`
  );

  try {
    // Execute the unlighthouse-ci command
    const command: string = `unlighthouse-ci --no-cache --build-static --output-path "${OUTPUT_DIRECTORY}/${site.name}" --site ${site.url}`;
    console.log(`Executing: ${command}`);

    execSync(command, { stdio: "inherit" });

    console.log(
      `\n--- Unlighthouse CI completed successfully for ${site.name}! ---\n`
    );
  } catch (error) {
    console.error(
      `\n--- Error running Unlighthouse CI for ${site.name}: ${(error as Error).message} ---\n`
    );
    // Not exiting the process here so it continues with the next site
  }
}

// Main function to run Unlighthouse CI for all sites
function runAll(): void {
  console.log("=== Starting Unlighthouse CI for all predefined sites ===");
  console.log(`Total sites to process: ${SITES.length}`);

  let successCount = 0;
  let failCount = 0;

  // Loop through each site and run Unlighthouse CI
  for (let i = 0; i < SITES.length; i++) {
    const site = SITES[i];
    console.log(`\nProcessing site ${i + 1} of ${SITES.length}: ${site.name}`);

    try {
      runUnlighthouseCI(site);
      successCount++;
    } catch (error) {
      console.error(
        `Failed to process ${site.name}: ${(error as Error).message}`
      );
      failCount++;
    }
  }

  // Print summary
  console.log("\n=== Unlighthouse CI Run Summary ===");
  console.log(`Total sites: ${SITES.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  console.log("===============================");
}

// Run the script
runAll();
