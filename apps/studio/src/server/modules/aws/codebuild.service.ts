import type { StartBuildCommandOutput } from "@aws-sdk/client-codebuild"
import type pino from "pino"
import {
  BatchGetBuildsCommand,
  CodeBuildClient,
  ListBuildsForProjectCommand,
  StartBuildCommand,
  StopBuildCommand,
} from "@aws-sdk/client-codebuild"

const client = new CodeBuildClient({ region: "ap-southeast-1" })

export const stopRunningBuilds = async (
  logger: pino.Logger<string>,
  projectId: string,
): Promise<void> => {
  try {
    // List builds for the given project
    const listBuildsCommand = new ListBuildsForProjectCommand({
      projectName: projectId,
    })
    const listBuildsResponse = await client.send(listBuildsCommand)

    const buildIds = listBuildsResponse.ids ?? []

    if (buildIds.length === 0) {
      logger.info({ projectId }, "No running builds found for the project")
      return
    }

    // Get details of the builds
    const batchGetBuildsCommand = new BatchGetBuildsCommand({ ids: buildIds })
    const batchGetBuildsResponse = await client.send(batchGetBuildsCommand)

    // Stop running builds
    for (const build of batchGetBuildsResponse.builds ?? []) {
      if (build.buildStatus === "IN_PROGRESS") {
        logger.info(
          { buildId: build.id },
          "Stopping currently running CodeBuild",
        )
        const stopBuildCommand = new StopBuildCommand({ id: build.id })
        await client.send(stopBuildCommand)
        logger.info({ buildId: build.id }, "Build stopped successfully")
      }
    }
  } catch (error) {
    logger.error(
      { projectId, error },
      "Unexpected error while stopping running builds",
    )

    throw error
  }
}

export const startProjectById = async (
  logger: pino.Logger<string>,
  projectId: string,
): Promise<StartBuildCommandOutput> => {
  try {
    // Stop any currently running builds
    await stopRunningBuilds(logger, projectId)

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
