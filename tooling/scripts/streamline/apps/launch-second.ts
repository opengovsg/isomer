import type { SiteLaunchSite } from "../types";
import {
  deleteAmplifyApp,
  getAllAmplifyApps,
  removeDomainAssociation,
} from "../utils/amplify";
import {
  createCloudFrontInvalidation,
  getAllCloudFrontDistributions,
  updateCloudFrontDistributionOriginPath,
} from "../utils/cloudfront";
import { getSiteLaunchBatch, updateSitesProductionCSV } from "../utils/csv";
import { confirm } from "@inquirer/prompts";
import { fetchWithRetry } from "../utils/http";
import { archiveGitHubRepo } from "../utils/github";
import { getRemoveAllSiteCollaboratorsQuery } from "../utils/db";

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
    message: `Can you confirm that you are launching ${siteLaunchSites.length} sites?`,
    default: true,
  });

  if (!isSiteLaunchCsvPopulated) {
    throw new Error(
      "Please ensure that the site launch CSV file is correctly populated before proceeding."
    );
  }
};

export const siteLaunchSecondWindow = async () => {
  console.log("Running script to launch sites...");
  const successfulSites: SiteLaunchSite[] = [];

  const siteLaunchSites = await getSiteLaunchBatch();
  await conductPreflightChecks(siteLaunchSites);
  console.log("Getting list of all Amplify apps...");
  const amplifyApps = await getAllAmplifyApps();
  console.log(`Found ${amplifyApps.length} Amplify apps in total.`);
  console.log("Getting list of all CloudFront distributions...");
  const distributions = await getAllCloudFrontDistributions();
  console.log(
    `Found ${distributions.length} CloudFront distributions in total.`
  );

  // Step 1: Call the AWS API to drop the domain associations from the Classic
  // Amplify app
  for (const site of siteLaunchSites) {
    const amplifyApp = amplifyApps.find(
      (app) =>
        app.domains.includes(site.isomerDomain) ||
        (site.redirectionDomain && app.domains.includes(site.redirectionDomain))
    );
    if (amplifyApp?.id === undefined) {
      console.error(`No Amplify app found for domain: ${site.isomerDomain}`);
      continue;
    }

    await removeDomainAssociation(amplifyApp.id);
  }

  // Step 2: Update the Isomer Next infra to set the sites to the `LAUNCHED`
  // state and perform a `pulumi up`.
  await updateSitesProductionCSV(
    siteLaunchSites.map(({ siteId }) => ({ siteId })),
    "LAUNCHED"
  );
  const isPulumiUpDone = await confirm({
    message:
      "Please run `pulumi up` inside isomer-next-infra to launch the site. Have you done so?",
    default: true,
  });

  if (!isPulumiUpDone) {
    throw new Error(
      "Please run `pulumi up` to launch the site before proceeding."
    );
  }

  // Step 3: Call the AWS API to update the origin path of the CloudFront
  // distributions and to perform an invalidation
  for (const site of siteLaunchSites) {
    const distribution = distributions.find((distribution) =>
      distribution.Origins?.Items?.some((origin) =>
        origin.DomainName?.includes(site.siteName)
      )
    );

    if (!distribution?.Id) {
      console.error(
        `No CloudFront distribution found for domain: ${site.isomerDomain}`
      );
      continue;
    }

    await updateCloudFrontDistributionOriginPath(
      distribution.Id,
      site.siteName
    );

    await createCloudFrontInvalidation(distribution.Id);
  }

  // Step 4: Verify that the site is up and accessible by checking for the
  // existence of `/sitemap.json`, which is a file that is specific to Isomer
  // Next sites
  for (const site of siteLaunchSites) {
    const url = `https://${site.isomerDomain}/sitemap.json`;
    try {
      await fetchWithRetry(url);
      console.log(`Site is live and accessible at: ${url}`);
      successfulSites.push(site);
    } catch (error) {
      console.error(`Site is not accessible at: ${url}`, error);

      // TODO: Prompt user to investigate and retry later
      continue;
    }
  }

  const isCleanupAcceptable = await confirm({
    message:
      "Shall we proceed to delete the old Classic Amplify apps, archive the GitHub repository, and remove the users from Isomer CMS?",
    default: true,
  });

  if (!isCleanupAcceptable) {
    console.log(
      "Cleanup steps skipped. Please remember to perform them manually later."
    );
    return;
  }

  const isOgpVpnConnected = await confirm({
    message: "Have you connected to the OGP VPN?",
    default: true,
  });

  if (!isOgpVpnConnected) {
    throw new Error(
      "Please connect to the OGP VPN before proceeding with cleanup steps."
    );
  }

  for (const site of successfulSites) {
    // Step 5: Call the AWS API to delete the old Classic Amplify app
    const amplifyApp = amplifyApps.find(
      (app) =>
        app.domains.includes(site.isomerDomain) ||
        (site.redirectionDomain && app.domains.includes(site.redirectionDomain))
    );
    if (amplifyApp?.id === undefined) {
      console.error(`No Amplify app found for domain: ${site.isomerDomain}`);
      continue;
    }

    console.log("Deleting Amplify app with id:", amplifyApp.id);
    await deleteAmplifyApp(amplifyApp.id);

    const stagingLiteAmplifyApp = amplifyApps.find(
      (app) => app.name === `${site.siteName}-staging-lite`
    );

    if (stagingLiteAmplifyApp?.id) {
      console.log(
        "Deleting staging-lite Amplify app with id:",
        stagingLiteAmplifyApp.id
      );
      await deleteAmplifyApp(stagingLiteAmplifyApp.id);
    }

    // Step 6: Call the GitHub API to archive the GitHub repository
    console.log("Archiving GitHub repository:", site.repoName);
    await archiveGitHubRepo(site.repoName);
  }

  console.log(
    "All cleanup steps completed successfully, please proceed to running the following SQL query on the Isomer CMS database to remove the site collaborators:"
  );

  getRemoveAllSiteCollaboratorsQuery(
    successfulSites.map((site) => site.repoName)
  );
};
