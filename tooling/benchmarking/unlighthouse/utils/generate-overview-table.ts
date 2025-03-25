import fs from "fs";
import path from "path";
import { OUTPUT_DIRECTORY } from "../constants";

interface SiteResult {
  path: string;
  score: number;
  performance: number;
  accessibility: number;
  "best-practices": number;
  seo: number;
}

function calculateAverage(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, num) => acc + num, 0);
  return sum / numbers.length;
}

function convertTo100Scale(number: number): number {
  return Math.round(number * 100);
}

try {
  // Assuming the results directory is at the same level as utils
  const resultsDir = path.resolve(__dirname, `../${OUTPUT_DIRECTORY}`);

  // Check if the results directory exists
  if (!fs.existsSync(resultsDir)) {
    console.error("Results directory not found:", resultsDir);
    process.exit(1);
  }

  const sites = fs
    .readdirSync(resultsDir)
    .filter((file) => fs.statSync(path.join(resultsDir, file)).isDirectory());

  // CSV header
  let csvContent =
    "site,score,performance,accessibility,best-practices,seo,site-quality\n";

  // Process each site and add to CSV content directly
  for (const site of sites) {
    const ciResultPath = path.join(resultsDir, site, "ci-result.json");

    if (!fs.existsSync(ciResultPath)) {
      console.warn(`No ci-result.json found for site: ${site}`);
      continue;
    }

    const ciResultData = fs.readFileSync(ciResultPath, "utf8");
    const ciResults: SiteResult[] = JSON.parse(ciResultData);

    if (ciResults.length === 0) {
      console.warn(`Empty results for site: ${site}`);
      continue;
    }

    // Calculate averages
    const score = calculateAverage(ciResults.map((r) => r.score));
    const performance = calculateAverage(ciResults.map((r) => r.performance));
    const accessibility = calculateAverage(
      ciResults.map((r) => r.accessibility)
    );
    const bestPractices = calculateAverage(
      ciResults.map((r) => r["best-practices"])
    );
    const seo = calculateAverage(ciResults.map((r) => r.seo));
    const siteQuality = calculateAverage([accessibility, bestPractices, seo]);

    // Add to CSV directly
    csvContent += `${site},${convertTo100Scale(score)},${convertTo100Scale(performance)},${convertTo100Scale(accessibility)},${convertTo100Scale(bestPractices)},${convertTo100Scale(seo)},${convertTo100Scale(siteQuality)}\n`;
  }

  // Save the CSV to a file
  const outputPath = path.resolve(__dirname, "../report.csv");
  fs.writeFileSync(outputPath, csvContent);

  console.log(`Overview report generated at: ${outputPath}`);
  console.log(csvContent);
} catch (error) {
  console.error("Error generating overview table:", error);
}
