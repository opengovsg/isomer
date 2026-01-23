import fs from "fs";
import path from "path";
import Papa from "papaparse";
import type { OnboardingSite, SiteLaunchSite } from "../types";

const ONBOARDING_BATCH_CSV = "onboarding.csv";
const SITE_LAUNCH_BATCH_CSV = "site-launch.csv";

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
