import { createReadStream, writeFileSync } from "fs";
import { join, dirname } from "path";
import csvParser from "csv-parser";

// Define the path to the input and output files
const currentDir = __dirname;
const inputFilePath = join(currentDir, "sites.production.csv");
const outputFilePath = join(dirname(currentDir), "sites.csv");

// Array to store filtered data
const extractedData: { shortName: string; domainAliases: string }[] = [];

// Create a readable stream for the CSV file
createReadStream(inputFilePath)
  .pipe(csvParser())
  .on("data", (row) => {
    // Skip if state is not "LAUNCHED" or if domainAliases starts with "test-"
    if (row.state !== "LAUNCHED" || row.domainAliases.startsWith("test-")) {
      return;
    }

    // Add the row to our extracted data, append "-next" to shortName
    // and "https://" to domainAliases
    extractedData.push({
      shortName: `${row.shortName}-next`,
      domainAliases: `https://${row.domainAliases}`,
    });
  })
  .on("end", () => {
    // Generate output CSV without header
    let outputCsvContent = "";
    extractedData.forEach((record) => {
      outputCsvContent += `${record.shortName},${record.domainAliases}\n`;
    });

    // Write the output to sites.csv in the parent directory
    writeFileSync(outputFilePath, outputCsvContent);

    console.log(`Extraction complete. Output written to ${outputFilePath}`);
    console.log(
      `Excluded sites that are not in LAUNCHED state or have domainAliases starting with "test-"`
    );
    console.log(`Added "https://" prefix to all domain aliases`);
    console.log(`Added "-next" suffix to all shortNames`);
  })
  .on("error", (error) => {
    console.error("Error parsing CSV:", error);
    process.exit(1);
  });
