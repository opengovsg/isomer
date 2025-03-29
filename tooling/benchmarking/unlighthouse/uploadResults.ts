import { execSync } from "child_process";
import * as path from "path";
import * as fs from "fs";
import { OUTPUT_DIRECTORY } from "../constants";

/**
 * Script to deploy all result directories to Cloudflare Pages.
 *
 * This script automatically deploys each subfolder found in the "results" directory.
 * Each subfolder name is used as the project name for deployment.
 *
 * Usage:
 *   ts-node upload-results.ts
 *
 * Example:
 *   If "results" contains folders "site-a" and "site-b", the script will deploy:
 *     - "results/site-a" to project "site-a"
 *     - "results/site-b" to project "site-b"
 */

const CLOUDFLARE_PAGES_BRANCH = "production";

// Path to the results directory
const RESULTS_DIR = path.resolve(OUTPUT_DIRECTORY);

function run() {
  // Validate results directory exists
  if (!fs.existsSync(RESULTS_DIR)) {
    console.error(`Error: Results directory '${RESULTS_DIR}' does not exist`);
    process.exit(1);
  }

  // Get all subdirectories in the results directory
  const subdirectories = fs
    .readdirSync(RESULTS_DIR, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  if (subdirectories.length === 0) {
    console.error(`Error: No subdirectories found in '${RESULTS_DIR}'`);
    process.exit(1);
  }

  console.log(`Found ${subdirectories.length} directories to deploy:`);
  subdirectories.forEach((dir) => console.log(`- ${dir}`));

  // Deploy each subdirectory
  let successCount = 0;
  let failureCount = 0;

  for (const dir of subdirectories) {
    const projectName = dir; // Use directory name as project name
    const directoryPath = path.join(RESULTS_DIR, dir);

    console.log(`\n\n========================================`);
    console.log(
      `Deploying '${dir}' to Cloudflare Pages project: ${projectName}`
    );
    console.log(`Directory path: ${directoryPath}`);
    console.log(`========================================`);

    try {
      // Deploy the Pages project
      // NOTE: This assumes that the project name is the same as the directory name,
      // and that the project already exists in Cloudflare Pages.
      console.log("=== Deploying Pages project ===");
      execSync(
        `npx wrangler pages deploy --branch "${CLOUDFLARE_PAGES_BRANCH}" "${directoryPath}" --project-name "${projectName}"`,
        { stdio: "inherit" }
      );

      console.log(`\n✅ Deployment of '${dir}' successful!`);
      successCount++;
    } catch (error) {
      console.error(`\n❌ Deployment of '${dir}' failed:`, error);
      failureCount++;
    }
  }

  // Print summary
  console.log(`\n\n========================================`);
  console.log(`Deployment Summary:`);
  console.log(`- Total: ${subdirectories.length}`);
  console.log(`- Successful: ${successCount}`);
  console.log(`- Failed: ${failureCount}`);
  console.log(`========================================`);

  if (failureCount > 0) {
    process.exit(1);
  }
}

// Execute the script
run();
