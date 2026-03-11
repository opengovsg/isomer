import type { Logger } from "pino"
import { pick } from "lodash"

import type { BuildChanges } from "./types"
import { getSiteNameAndCodeBuildId } from "../site/site.service"
import {
  addCodeBuildAndMarkSupersededBuild,
  computeBuildChanges,
  startProjectById,
} from "./utils"

interface PublishSiteArgs {
  siteId: number
  codebuildJob?: {
    isScheduled: boolean
    resourceWithUserIds: { resourceId: string; userId: string }[]
  }
}

export const publishSite = async (
  logger: Logger<string>,
  { siteId, codebuildJob }: PublishSiteArgs,
) => {
  // Step 1: Get the CodeBuild ID associated with the site
  const site = await getSiteNameAndCodeBuildId(siteId)
  const { codeBuildId } = site
  if (!codeBuildId) {
    // NOTE: Not all sites will have a CodeBuild project, as the site may not be
    // ready for a site launch yet. Only sites that are launched will have a
    // CodeBuild project associated with the site.
    logger.info(
      { siteId },
      "No CodeBuild project ID has been configured for the site",
    )
    return
  }

  // Step 2: Determine if a new build should be started
  const buildChanges = await computeBuildChanges(logger, codeBuildId)
  let buildChangesWithStartedBuild: BuildChanges

  // Step 3: Start a new build if needed
  if (buildChanges.isNewBuildNeeded) {
    const startedBuild = await startProjectById(logger, codeBuildId)
    buildChangesWithStartedBuild = { ...buildChanges, startedBuild }
    logger.info(
      {
        siteId,
        codeBuildId,
      },
      "Started new CodeBuild project run",
    )
  } else {
    buildChangesWithStartedBuild = buildChanges
  }

  // Step 4: Record the build in the database and mark any superseded builds
  if (codebuildJob) {
    await addCodeBuildAndMarkSupersededBuild({
      buildChanges: buildChangesWithStartedBuild,
      siteId,
      ...pick(codebuildJob, ["isScheduled", "resourceWithUserIds"]),
    })
  }
}
