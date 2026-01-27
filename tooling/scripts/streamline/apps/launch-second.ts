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
import { removeAllSiteCollaborators } from "../utils/db";

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
  const amplifyApps = await getAllAmplifyApps();
  const distributions = await getAllCloudFrontDistributions();

  // Step 1: Call the AWS API to drop the domain associations from the Classic
  // Amplify app
  for (const site of siteLaunchSites) {
    const amplifyApp = amplifyApps.find((app) =>
      app.domains.includes(site.isomerDomain)
    );
    if (amplifyApp?.id === undefined) {
      console.error(`No Amplify app found for domain: ${site.isomerDomain}`);
      continue;
    }

    await removeDomainAssociation(amplifyApp.id, site.isomerDomain);
    console.log(
      `Removed domain association for site: ${site.siteName} (${site.isomerDomain})`
    );
  }

  // Step 2: Update the Isomer Next infra to set the sites to the `LAUNCHED`
  // state and perform a `pulumi up`.
  await updateSitesProductionCSV(
    siteLaunchSites.map(({ siteId }) => ({ siteId })),
    "LAUNCHED"
  );
  await confirm({
    message:
      "Please run `pulumi up` inside isomer-next-infra to launch the site. Have you done so?",
    default: true,
  });

  // Step 3: Call the AWS API to update the origin path of the CloudFront
  // distributions and to perform an invalidation
  for (const site of siteLaunchSites) {
    const distribution = distributions.find((distribution) =>
      distribution.Aliases?.Items?.includes(site.isomerDomain)
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
    const amplifyApp = amplifyApps.find((app) =>
      app.domains.includes(site.isomerDomain)
    );
    if (amplifyApp?.id === undefined) {
      console.error(`No Amplify app found for domain: ${site.isomerDomain}`);
      continue;
    }

    await deleteAmplifyApp(amplifyApp.id);

    // Step 6: Call the GitHub API to archive the GitHub repository
    await archiveGitHubRepo(site.repoName);

    // Step 7: Connect to the Classic database and remove the agency users from
    // the list of collaborators
    await removeAllSiteCollaborators(site.repoName);
  }
};
