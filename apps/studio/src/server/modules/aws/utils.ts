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
  BuildChanges,
  RequiresNewBuild,
  RequiresNoNewBuild,
} from "./types"
import { db } from "../database"
import { RECENT_BUILD_THRESHOLD_SECONDS } from "./constants"

const client = new CodeBuildClient({ region: "ap-southeast-1" })

/**
 * Adds a new CodeBuildJob entry for the newly started build,
 * and marks any stopped builds as superseded by the new build
 * @param tx Transaction
 * @param stoppedBuildId The build ID of the stopped build
 * @param startedBuildId The build ID of the newly started build
 */
export const addCodeBuildAndMarkSupersededBuild = async ({
  buildChanges,
  resourceId,
  siteId,
  userId,
  isScheduled,
}: {
  buildChanges: BuildChanges
  siteId: number
  userId: string
  isScheduled?: boolean
  resourceId?: string
}) => {
  let buildIdToLink: string | undefined
  let buildStartTime: Date | undefined
  if (buildChanges.isNewBuildNeeded) {
    const { id: startedBuildId, startTime: startedBuildTime } =
      buildChanges.startedBuild
    buildIdToLink = startedBuildId
    buildStartTime = startedBuildTime
  } else {
    buildIdToLink = buildChanges.latestRunningBuild?.id
    buildStartTime = buildChanges.latestRunningBuild?.startTime
  }

  // Insert a new row into CodeBuildJobs to link the resourceId, userId, siteId to the build
  await db
    .insertInto("CodeBuildJobs")
    .values({
      siteId,
      userId,
      buildId: buildIdToLink,
      startedAt: buildStartTime,
      resourceId,
      isScheduled,
    })
    .execute()
  // If a new build was started, mark the stopped build (if any) as being superseded by the new build
  if (buildChanges.isNewBuildNeeded && buildChanges.stoppedBuild?.id) {
    await updateStoppedBuild({
      startedBuildId: buildChanges.startedBuild.id,
      stoppedBuildId: buildChanges.stoppedBuild.id,
    })
  }
}

/**
 * This function updates all builds that were superseded by the stopped build to now be superseded by the newly started build.
 * This ensures that in scenarios where multiple builds are superseded (e.g., A -> B -> C), all builds that were previously
 * marked as superseded by B will now be marked as superseded by C.
 * @param startedBuildId The build ID of the newly started build
 * @param stoppedBuildId The build ID of the stopped build
 */
export const updateStoppedBuild = async ({
  startedBuildId,
  stoppedBuildId,
}: {
  startedBuildId: string
  stoppedBuildId: string
}) => {
  await db
    .updateTable("CodeBuildJobs")
    .set({
      supersededByBuildId: startedBuildId,
      status: "STOPPED",
    })
    .where(
      "buildId",
      "in",
      db
        .selectFrom("CodeBuildJobs")
        .select("buildId")
        .where("supersededByBuildId", "=", stoppedBuildId)
        .unionAll(
          db.selectNoFrom((eb) => [eb.val(stoppedBuildId).as("buildId")]),
        ),
    )
    .execute()
}

export const computeBuildChanges = async (
  logger: Logger<string>,
  projectId: string,
): Promise<Omit<RequiresNewBuild, "startedBuild"> | RequiresNoNewBuild> => {
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
          ...latestBuild,
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
