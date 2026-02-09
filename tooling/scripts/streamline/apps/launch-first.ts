import {
  getAllCloudFrontDistributions,
  getCloudFrontDistributionDomainName,
} from "../utils/cloudfront";
import { updateSitesProductionCSV } from "../utils/csv";
import { getSiteLaunchBatch } from "../utils/csv";
import { getSiteConfig, updateSiteConfig } from "../utils/db";
import { createApplication, getAuthToken } from "../utils/searchsg";
import { confirm } from "@inquirer/prompts";
import {
  createMaintenanceWindow,
  getUptimeRobotMonitors,
} from "../utils/uptimerobot";
import { createOrUpdateIndirectionRecord } from "../utils/github";
import type { SiteLaunchSite } from "../types";

const conductPreflightChecks = async (siteLaunchSites: SiteLaunchSite[]) => {
  const isDbConnected = await confirm({
    message:
      'Have you ran "npm run db:connect" to connect to the Isomer Studio database?',
    default: true,
  });

  if (!isDbConnected) {
    throw new Error(
      "Please connect to the Isomer Studio database before proceeding."
    );
  }

  const isSiteLaunchCsvPopulated = await confirm({
    message: `Can you confirm that you are preparing ${siteLaunchSites.length} sites for launch?`,
    default: true,
  });

  if (!isSiteLaunchCsvPopulated) {
    throw new Error(
      "Please ensure that the site launch CSV file is correctly populated before proceeding."
    );
  }
};

export const siteLaunchFirstWindow = async () => {
  console.log("Running script to prepare sites for site launch 1st window...");
  const successfulSites: SiteLaunchSite[] = [];

  const siteLaunchSites = await getSiteLaunchBatch();
  const searchSGAuthToken = await getAuthToken();
  const distributions = await getAllCloudFrontDistributions();
  const monitors = await getUptimeRobotMonitors();

  await conductPreflightChecks(siteLaunchSites);

  for (const site of siteLaunchSites) {
    console.log(
      `Preparing site: ${site.repoName}, domain: ${site.isomerDomain}`
    );

    // Step 1: Call the SearchSG API to create the SearchSG client for the site
    // and update the site config inside Isomer Studio with the SearchSG client ID
    const siteId = parseInt(site.siteId, 10);
    const siteConfig = await getSiteConfig(siteId);
    let createApplicationRes: Awaited<ReturnType<typeof createApplication>>;

    try {
      createApplicationRes = await createApplication(
        searchSGAuthToken,
        siteConfig.siteName,
        site.isomerDomain,
        siteConfig.brandColor
      );
    } catch (error) {
      // NOTE: It is possible that the SearchSG client for the site already
      // exists for the given name, we will retry once with a space appended
      // to the name, and give up if it still fails.
      console.warn(
        `Warning: Failed to create SearchSG client for site ${site.repoName} with domain ${site.isomerDomain}. Retrying once...`,
        error
      );
      try {
        createApplicationRes = await createApplication(
          searchSGAuthToken,
          `${siteConfig.siteName} `,
          site.isomerDomain,
          siteConfig.brandColor
        );
      } catch (retryError) {
        console.error(
          `Error: Failed to create SearchSG client for site ${site.repoName} with domain ${site.isomerDomain} on retry. Skipping...`,
          retryError
        );
        continue;
      }
    }

    const searchSGClientId = createApplicationRes.application.applicationId;
    await updateSiteConfig(siteId, searchSGClientId);

    // Step 2: Call the AWS API to get the details of the CloudFront
    // distributions for each individual site, then call the GitHub API to
    // update the indirection layer with the new CloudFront distribution
    const distributionDomainName = getCloudFrontDistributionDomainName(
      distributions,
      site.siteName
    );

    if (distributionDomainName === null) {
      console.error(
        `Error: Could not find CloudFront distribution for site ${site.repoName} with domain ${site.isomerDomain}. Skipping...`
      );
      continue;
    }

    await createOrUpdateIndirectionRecord(
      site.isomerDomain,
      distributionDomainName
    );

    successfulSites.push(site);
  }

  // Step 3: Call the UptimeRobot API to set up a maintenance window for each
  // individual site
  const monitorIds = successfulSites
    .map((site) => {
      const monitor = monitors.find((m) => m.url.includes(site.isomerDomain));
      return monitor?.id || null;
    })
    .filter((id): id is number => id !== null);

  if (monitorIds.length > 0) {
    await createMaintenanceWindow(monitorIds);
  }

  // Step 4: Update the Isomer Next infra to set the sites to the `PRELAUNCH`
  // state
  await updateSitesProductionCSV(
    successfulSites.map((site) => ({ siteId: site.siteId })),
    "PRELAUNCH"
  );

  console.log(
    `Successfully prepared ${successfulSites.length} sites for site launch 1st window.`
  );

  await confirm({
    message:
      "Have you run `pulumi up` inside isomer-next-infra to apply the changes?",
    default: true,
  });
};
