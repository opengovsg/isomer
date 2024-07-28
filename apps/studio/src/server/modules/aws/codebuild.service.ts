import {
  BatchGetProjectsCommand,
  CodeBuildClient,
  CreateProjectCommand,
  StartBuildCommand,
} from "@aws-sdk/client-codebuild"
import { ServiceException } from "@aws-sdk/smithy-client"

const client = new CodeBuildClient({ region: "ap-southeast-1" })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getProjectById = async (projectId: string): Promise<any> => {
  const command = new BatchGetProjectsCommand({ names: [projectId] })

  try {
    const response = await client.send(command)
    console.log("AWS response", JSON.stringify(response))
    if (response.projects && response.projects.length > 0) {
      return response.projects[0]
    } else {
      throw new Error(`Project with ID ${projectId} not found`)
    }
  } catch (error) {
    if (error instanceof ServiceException) {
      console.error("Service error:", error)
    } else {
      console.error("Unexpected error:", error)
    }
    throw error
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const startProjectById = async (projectId: string): Promise<any> => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const project = await getProjectById(projectId)

  if (!project) {
    throw new Error(`Project with ID ${projectId} not found`)
  }

  const command = new StartBuildCommand({ projectName: projectId })

  try {
    const response = await client.send(command)
    return response
  } catch (error) {
    if (error instanceof ServiceException) {
      console.error("Service error:", error)
    } else {
      console.error("Unexpected error:", error)
    }
    throw error
  }
}

export const createCodeBuildProject = async ({
  projectId,
  siteId,
}: {
  projectId: string
  siteId: number
}): Promise<any> => {
  /* TODO: Things to add
1. VPC config
2. Default service role
3. Move buildspec out
4. Setup logs
*/
  const command = new CreateProjectCommand({
    name: projectId,
    source: {
      type: "NO_SOURCE",
      buildspec:
        'version: 0.2\n\nphases:\n  build:\n    commands:\n       - echo "hello"\n',
    },
    artifacts: {
      type: "NO_ARTIFACTS",
    },
    environment: {
      type: "LINUX_CONTAINER",
      image: "aws/codebuild/amazonlinux2-x86_64-standard:5.0",
      imagePullCredentialsType: "CODEBUILD",
      computeType: "BUILD_GENERAL1_SMALL",
      environmentVariables: [{ name: "SITE_ID", value: siteId.toString() }],
    },
    serviceRole: "",
    logsConfig: {
      cloudWatchLogs: {
        status: "DISABLED",
      },
      s3Logs: {
        status: "DISABLED",
      },
    },
  })

  try {
    const response = await client.send(command)
    console.log("AWS Create project res: ", JSON.stringify(response))
    return response
  } catch (error) {
    if (error instanceof ServiceException) {
      console.error("Service error:", error)
    } else {
      console.error("Unexpected error:", error)
    }
    throw error
  }
}
