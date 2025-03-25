import * as fs from "fs";
import { Site } from "../types";

export function loadSitesFromCSV(filePath: string): Site[] {
  try {
    const csvContent = fs.readFileSync(filePath, "utf8");
    const lines = csvContent.split("\n").filter((line) => line.trim() !== "");

    return lines.map((line) => {
      const [name, url] = line.split(",");
      return { name, url } as Site;
    });
  } catch (error) {
    console.error(`Error reading CSV file: ${(error as Error).message}`);
    return [];
  }
}
