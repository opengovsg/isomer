import type { StartBuildCommandOutput } from "@aws-sdk/client-codebuild"
import type { Logger } from "pino"
import {
  BatchGetBuildsCommand,
  CodeBuildClient,
  ListBuildsForProjectCommand,
  StartBuildCommand,
} from "@aws-sdk/client-codebuild"
import { TRPCError } from "@trpc/server"

import { getSiteNameAndCodeBuildId } from "../site/site.service"

const client = new CodeBuildClient({ region: "ap-southeast-1" })
// This is the threshold for a build to be considered recent
// It is roughly the amount of time it takes for a build to progress before
// the publishing script queries the database for the pages data, as that older
// build would have already captured the latest changes
const RECENT_BUILD_THRESHOLD_SECONDS = 60

export const publishSite = async (
  logger: Logger<string>,
  siteId: number,
): Promise<void> => {
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
  const isNewBuildNeeded = await shouldStartNewBuild(logger, codeBuildId)

  if (!isNewBuildNeeded) {
    return
  }

  // Step 3: Start a new build
  await startProjectById(logger, codeBuildId)
}

export const shouldStartNewBuild = async (
  logger: Logger<string>,
  projectId: string,
): Promise<boolean> => {
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
      return true
    }

    // Get details of the builds
    const batchGetBuildsCommand = new BatchGetBuildsCommand({ ids: buildIds })
    const batchGetBuildsResponse = await client.send(batchGetBuildsCommand)

    // Find for running builds that are considered recent
    const recentRunningBuilds =
      batchGetBuildsResponse.builds?.filter((build) => {
        const buildStartTime = new Date(build.startTime ?? "")
        return (
          build.buildStatus === "IN_PROGRESS" &&
          buildStartTime > thresholdTimeAgo
        )
      }) ?? []

    if (recentRunningBuilds.length > 0) {
      logger.info(
        { projectId, buildIds: recentRunningBuilds.map((build) => build.id) },
        "Not starting a new build as there are recent builds that are still running",
      )
      return false
    }

    return true
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
): Promise<StartBuildCommandOutput> => {
  try {
    // Start a new build
    const command = new StartBuildCommand({ projectName: projectId })
    const response = await client.send(command)
    return response
  } catch (error) {
    logger.error(
      { projectId, error },
      "Unexpected error when starting CodeBuild project run",
    )
    throw error
  }
}
