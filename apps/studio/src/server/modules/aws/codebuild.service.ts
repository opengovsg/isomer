import type { StartBuildCommandOutput } from "@aws-sdk/client-codebuild"
import type pino from "pino"
import { CodeBuildClient, StartBuildCommand } from "@aws-sdk/client-codebuild"
import { ServiceException } from "@aws-sdk/smithy-client"

const client = new CodeBuildClient({ region: "ap-southeast-1" })

export const startProjectById = async (
  logger: pino.Logger<string>,
  projectId: string,
): Promise<StartBuildCommandOutput> => {
  const command = new StartBuildCommand({ projectName: projectId })

  try {
    const response = await client.send(command)
    return response
  } catch (error) {
    if (error instanceof ServiceException) {
      logger.error({ projectId, error }, "AWS CodeBuild service exception")
    } else {
      logger.error(
        { projectId, error },
        "Unexpected error when starting CodeBuild project run",
      )
    }
    throw error
  }
}
