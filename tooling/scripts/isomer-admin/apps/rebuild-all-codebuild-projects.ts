/**
 * Rebuild all AWS CodeBuild projects.
 *
 * Lists all CodeBuild projects in the selected AWS region, sorts them
 * alphabetically, then starts a build for each project with a configurable
 * interval between builds. Supports resumability by prompting for the project
 * index to start at.
 *
 * How to use:
 *   1. Authenticate with AWS first, e.g.:
 *        aws sso login --profile <your-profile>
 *   2. Run the admin CLI from tooling/scripts:
 *        npm run isomer-admin
 *   3. Select "Rebuild all CodeBuild projects" and answer the prompts.
 *
 * Tip: Run in dry-run mode first to list all project indexes, then rerun with
 * dry-run disabled and the desired start index.
 */
import {
  CodeBuildClient,
  ListProjectsCommand,
  StartBuildCommand,
} from "@aws-sdk/client-codebuild"
import { confirm, input, number } from "@inquirer/prompts"
import { appendFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"

interface RebuildCodeBuildProjectsOptions {
  region: string
  dryRun: boolean
  startAt: number
  interval: number
}

const formatTimestamp = (): string => new Date().toISOString()

const logLine = (message: string, logFilePath: string | null): void => {
  const line = `${message}\n`
  process.stdout.write(line)
  if (logFilePath) {
    appendFileSync(logFilePath, line)
  }
}

const listAllProjects = async (client: CodeBuildClient): Promise<string[]> => {
  const projects: string[] = []
  let nextToken: string | undefined

  do {
    const response = await client.send(new ListProjectsCommand({ nextToken }))
    if (response.projects) {
      projects.push(...response.projects)
    }
    nextToken = response.nextToken
  } while (nextToken)

  return projects.sort((a, b) => a.localeCompare(b))
}

const getInputs = async (): Promise<RebuildCodeBuildProjectsOptions> => {
  const awsProfile = await input({
    message:
      "AWS profile to use (leave blank to use your current default AWS credentials)",
    default: process.env.AWS_PROFILE,
  })

  if (awsProfile.trim()) {
    process.env.AWS_PROFILE = awsProfile.trim()
  }

  const region = await input({
    message: "AWS region containing the CodeBuild projects",
    default: "ap-southeast-1",
    validate: (value) => Boolean(value.trim()) || "AWS region is required.",
  })

  const dryRun = await confirm({
    message:
      "Run in dry-run mode? This lists projects and their indexes without starting builds.",
    default: true,
  })

  const startAt =
    (await number({
      message:
        "Project index to start from. Use this to resume after a previous run.",
      default: 0,
      required: true,
      validate: (value) =>
        Number.isInteger(value) && value >= 0
          ? true
          : "Start index must be a non-negative integer.",
    })) ?? 0

  const interval =
    (await number({
      message:
        "Seconds to wait between starting each build. Increase this to reduce AWS API pressure.",
      default: 5,
      required: true,
      validate: (value) =>
        Number.isInteger(value) && value >= 0
          ? true
          : "Interval must be a non-negative integer.",
    })) ?? 5

  return { region: region.trim(), dryRun, startAt, interval }
}

export const rebuildAllCodebuildProjects = async (): Promise<void> => {
  const { region, dryRun, startAt, interval } = await getInputs()

  const client = new CodeBuildClient({ region })
  const allProjects = await listAllProjects(client)

  if (allProjects.length === 0) {
    console.log("No CodeBuild projects found.")
    return
  }

  const logsDir = join(process.cwd(), "logs")
  const logFileName = `codebuild-rebuild-${formatTimestamp().replace(/[:.]/g, "-")}.log`
  const logFilePath = dryRun ? null : join(logsDir, logFileName)

  if (!dryRun) {
    mkdirSync(logsDir, { recursive: true })
    logLine(
      `[${formatTimestamp()}] Starting rebuild of ${allProjects.length} projects (from index ${startAt})`,
      logFilePath,
    )
  }

  const projectsToProcess = allProjects.slice(startAt)

  if (dryRun) {
    console.log(
      `Found ${allProjects.length} projects (alphabetically sorted):\n`,
    )
    for (let i = 0; i < allProjects.length; i++) {
      console.log(`  [${i}] ${allProjects[i]}`)
    }
    console.log(
      "\nRun this script again with dry-run disabled and the desired start index to trigger builds.",
    )
    return
  }

  console.log(
    `Processing ${projectsToProcess.length} projects (indices ${startAt} to ${
      startAt + projectsToProcess.length - 1
    })`,
  )
  console.log(`Log file: ${logFilePath}\n`)

  for (let i = 0; i < projectsToProcess.length; i++) {
    const projectName = projectsToProcess[i]
    const index = startAt + i

    try {
      const { build } = await client.send(
        new StartBuildCommand({ projectName }),
      )
      const buildId = build?.id ?? "unknown"
      const line = `[${formatTimestamp()}] [${index}] ${projectName} | ${buildId} | started`
      logLine(line, logFilePath)
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error)
      const line = `[${formatTimestamp()}] [${index}] ${projectName} | ERROR | ${errMsg}`
      logLine(line, logFilePath)
      console.error(`Failed to start build for ${projectName}:`, error)
    }

    if (i < projectsToProcess.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, interval * 1000))
    }
  }

  logLine(
    `[${formatTimestamp()}] Completed ${projectsToProcess.length} builds`,
    logFilePath,
  )
}
