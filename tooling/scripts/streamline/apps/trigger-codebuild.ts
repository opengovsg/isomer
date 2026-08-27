import { getCodeBuildSiteNames } from "../utils/csv";
import { triggerCodeBuildBuilds } from "../utils/codebuild";

export const triggerCodeBuildBuildsFromCsv = async () => {
  console.log("Running script to trigger CodeBuild builds from CSV...");
  const siteNames = await getCodeBuildSiteNames();

  console.log(`Triggering CodeBuild builds for ${siteNames.length} sites...`);
  await triggerCodeBuildBuilds(siteNames);
};
