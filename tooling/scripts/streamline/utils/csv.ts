import fs from "fs";
import path from "path";
import Papa from "papaparse";
import * as dotenv from "dotenv";
import type { OnboardingSite, SiteLaunchSite } from "../types";

const ONBOARDING_BATCH_CSV = "onboarding.csv";
const SITE_LAUNCH_BATCH_CSV = "site-launch.csv";

dotenv.config({
  path: path.join(__dirname, "..", ".env"),
});

export const getOnboardingBatch = async () => {
  const csvFilePath = path.join(__dirname, "..", ONBOARDING_BATCH_CSV);
  const fileContent = await fs.promises.readFile(csvFilePath, "utf-8");
  const parsed = Papa.parse<OnboardingSite>(fileContent, {
    header: true,
    skipEmptyLines: true,
  });

  return parsed.data;
};

export const getSiteLaunchBatch = async () => {
  const csvFilePath = path.join(__dirname, "..", SITE_LAUNCH_BATCH_CSV);
  const fileContent = await fs.promises.readFile(csvFilePath, "utf-8");
  const parsed = Papa.parse<SiteLaunchSite>(fileContent, {
    header: true,
    skipEmptyLines: true,
  });

  return parsed.data;
};

interface SitesProductionCSVRow {
  siteId: string;
  siteName?: string;
  shortName?: string;
  instanceType?: string;
  domainAliases?: string;
}

export const updateSitesProductionCSV = async (
  sites: SitesProductionCSVRow[],
  state: "PREVIEW_ONLY" | "PRELAUNCH" | "LAUNCHED"
) => {
  const csvFilePath = path.join(process.env.SITES_CSV_PATH || "");
  const fileContent = await fs.promises.readFile(csvFilePath, "utf-8");
  const parsed = Papa.parse<SitesProductionCSVRow>(fileContent, {
    header: true,
    skipEmptyLines: true,
  });
  const rowsToAdd = sites
    .filter((site) => !parsed.data.some((row) => row.siteId === site.siteId))
    .map((site) => ({ ...site, state }));
  const updatedRows = parsed.data.map((row) => {
    const siteToUpdate = sites.find((site) => site.siteId === row.siteId);
    if (siteToUpdate) {
      return {
        ...row,
        ...siteToUpdate,
        state,
      };
    }

    return row;
  });
  const finalRows = [...updatedRows, ...rowsToAdd];

  const csv = Papa.unparse(finalRows);
  await fs.promises.writeFile(csvFilePath, `${csv}\n`);
};
