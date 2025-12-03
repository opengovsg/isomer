import type { Logger } from "pino"
import {
  BatchGetBuildsCommand,
  CodeBuildClient,
  ListBuildsForProjectCommand,
  StartBuildCommand,
  StopBuildCommand,
} from "@aws-sdk/client-codebuild"
import { TRPCError } from "@trpc/server"

import type {
  PublishSiteResult,
  PublishSiteWithNewBuild,
  PublishSiteWithoutNewBuild,
} from "../resource/resource.types"
import { getSiteNameAndCodeBuildId } from "../site/site.service"

const client = new CodeBuildClient({ region: "ap-southeast-1" })
// This is the threshold for a build to be considered recent
// It is roughly the amount of time it takes for a build to progress before
// the publishing script queries the database for the pages data, as that older
// build would have already captured the latest changes
const RECENT_BUILD_THRESHOLD_SECONDS = 30

export const publishSite = async (
  logger: Logger<string>,
  siteId: number,
): Promise<PublishSiteResult | undefined> => {
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
  const res = await buildChanges(logger, codeBuildId)

  if (!res.isNewBuildNeeded)
    return {
      isNewBuildNeeded: false,
      latestRunningBuild: res.latestRunningBuild,
    }

  // Step 3: Start a new build
  const build = await startProjectById(logger, codeBuildId)

  logger.info(
    {
      siteId,
      codeBuildId,
    },
    "Started new CodeBuild project run",
  )

  return {
    startedBuild: build,
    stoppedBuild: res.stoppedBuild,
    isNewBuildNeeded: true,
  }
}

export const buildChanges = async (
  logger: Logger<string>,
  projectId: string,
): Promise<
  PublishSiteWithoutNewBuild | Omit<PublishSiteWithNewBuild, "startedBuild">
> => {
  const now = new Date()
  const thresholdTimeAgo = new Date(
    now.getTime() - RECENT_BUILD_THRESHOLD_SECONDS * 1000,
  )

  try {
    // List builds for the given project
    const listBuildsCommand = new ListBuildsForProjectCommand({
      projectName: projectId,
      sortOrder: "DESCENDING",
    })
    const listBuildsResponse = await client.send(listBuildsCommand)

    const buildIds = listBuildsResponse.ids ?? []

    if (buildIds.length === 0) {
      logger.info({ projectId }, "No builds found for the project")
      return { isNewBuildNeeded: true }
    }

    // Get details of the builds
    const batchGetBuildsCommand = new BatchGetBuildsCommand({ ids: buildIds })
    const batchGetBuildsResponse = await client.send(batchGetBuildsCommand)

    // Case 1: Start a new build if there are no existing running builds
    const runningBuilds = batchGetBuildsResponse.builds?.filter(
      (build) => build.buildStatus === "IN_PROGRESS",
    )

    if (runningBuilds?.length === 0) {
      return { isNewBuildNeeded: true }
    }

    // Case 2: Start a new build if there is only 1 running build, and it is
    // not recent
    // Find for running builds that are considered recent
    const recentRunningBuilds = batchGetBuildsResponse.builds?.filter(
      (build) => {
        const buildStartTime = new Date(build.startTime ?? "")
        return (
          build.buildStatus === "IN_PROGRESS" &&
          buildStartTime > thresholdTimeAgo
        )
      },
    )

    if (runningBuilds?.length === 1 && recentRunningBuilds?.length === 0) {
      return { isNewBuildNeeded: true }
    }

    // Case 3: Start a new build if there are 2 running builds, and both are
    // not recent. We will stop one of the builds to start a new one.
    if (runningBuilds?.length === 2 && recentRunningBuilds?.length === 0) {
      // Stop the latest build
      const latestBuild = runningBuilds
        .sort((a, b) => {
          const aStartTime = new Date(a.startTime ?? "")
          const bStartTime = new Date(b.startTime ?? "")
          return bStartTime.getTime() - aStartTime.getTime()
        })
        .at(0)

      if (!latestBuild?.id || !latestBuild.startTime) {
        logger.error(
          { projectId },
          "Unable to determine the latest build to stop",
        )
        return { isNewBuildNeeded: true }
      }

      const stopBuildCommand = new StopBuildCommand({
        id: latestBuild.id,
      })

      await client.send(stopBuildCommand)

      return {
        stoppedBuild: {
          id: latestBuild.id,
          startTime: latestBuild.startTime,
        },
        isNewBuildNeeded: true,
      }
    }

    // Any other case, we should not start a new build
    const [runningBuild] = runningBuilds ?? []
    if (!runningBuild?.id || !runningBuild.startTime) {
      logger.error(
        { projectId },
        "Unable to determine the latest running build",
      )
      return { isNewBuildNeeded: true }
    }
    return {
      isNewBuildNeeded: false,
      latestRunningBuild: {
        id: runningBuild.id,
        startTime: runningBuild.startTime,
      },
    }
  } catch (error) {
    logger.error(
      { projectId, error },
      "Unexpected error while determining if new builds should be started",
    )
    throw error
  }
}

export const startProjectById = async (
  logger: Logger<string>,
  projectId: string,
) => {
  try {
    // Start a new build
    const command = new StartBuildCommand({ projectName: projectId })
    const { build } = await client.send(command)
    // in theory build should always be defined, but adding a check just in case
    if (!build?.id || !build.startTime) {
      logger.error(
        { build },
        `Failed to obtain codebuild metadata for ${projectId}`,
      )
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to obtain codebuild metadata for ${projectId}`,
      })
    }
    return { id: build.id, startTime: build.startTime }
  } catch (error) {
    logger.error(
      { projectId, error },
      `Unexpected error when starting CodeBuild project run for ${projectId}`,
    )
    throw error
  }
}
