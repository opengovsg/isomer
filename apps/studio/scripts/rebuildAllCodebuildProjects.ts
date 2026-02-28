#!/usr/bin/env tsx
/**
 * Rebuild all AWS CodeBuild projects.
 *
 * Lists all CodeBuild projects (sorted alphabetically), starts a build for each
 * with configurable intervals. Supports resumability via --start-at.
 *
 * How to use:
 *   1. Authenticate with AWS first, e.g.:
 *        aws sso login --profile <your-profile>
 *   2. Set the profile (if not using default):
 *        export AWS_PROFILE=<your-profile>
 *   3. Run from apps/studio:
 *        npx tsx scripts/rebuildAllCodebuildProjects.ts
 *        npx tsx scripts/rebuildAllCodebuildProjects.ts --dry-run
 *        npx tsx scripts/rebuildAllCodebuildProjects.ts --start-at 42
 *        npx tsx scripts/rebuildAllCodebuildProjects.ts --interval 10 --region ap-southeast-1
 */
import { appendFileSync, mkdirSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import {
  CodeBuildClient,
  ListProjectsCommand,
  StartBuildCommand,
} from "@aws-sdk/client-codebuild"

const __dirname = dirname(fileURLToPath(import.meta.url))

function parseArgs() {
  const args = process.argv.slice(2)
  const getArg = (name: string): string | undefined => {
    const i = args.indexOf(`--${name}`)
    return i >= 0 ? args[i + 1] : undefined
  }
  const hasFlag = (name: string): boolean => args.includes(`--${name}`)

  const region = getArg("region") ?? "ap-southeast-1"
  const dryRun = hasFlag("dry-run")
  const startAt = parseInt(getArg("start-at") ?? "0", 10)
  const interval = parseInt(getArg("interval") ?? "5", 10)

  return { region, dryRun, startAt, interval }
}

function logLine(message: string, logFilePath: string | null): void {
  const line = `${message}\n`
  process.stdout.write(line)
  if (logFilePath) {
    appendFileSync(logFilePath, line)
  }
}

function formatTimestamp(): string {
  return new Date().toISOString()
}

async function listAllProjects(client: CodeBuildClient): Promise<string[]> {
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

async function main(): Promise<void> {
  const { region, dryRun, startAt, interval } = parseArgs()

  const client = new CodeBuildClient({ region })
  const allProjects = await listAllProjects(client)

  if (allProjects.length === 0) {
    console.log("No CodeBuild projects found.")
    return
  }

  const logsDir = join(__dirname, "logs")
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
      `\nTo start from a specific index: npm run codebuild:rebuild-all -- --start-at <index>`,
    )
    return
  }

  console.log(
    `Processing ${projectsToProcess.length} projects (indices ${startAt} to ${startAt + projectsToProcess.length - 1})`,
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

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
