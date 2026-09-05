import { pick } from "lodash-es"
import { spawn } from "node:child_process"
import { existsSync } from "node:fs"
import { copyFile, mkdtemp, rename, rm } from "node:fs/promises"
import path from "node:path"
import { env } from "~/env.mjs"

import type { Logger } from "@isomer/logging"

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

const REPO_ROOT = path.resolve(process.cwd(), "../..")
const PUBLISHING_DIR = path.join(REPO_ROOT, "tooling/build/scripts/publishing")
const LOCAL_PUBLISH_DIR = path.join(
  REPO_ROOT,
  "tooling/template/.local-publish",
)
const LOCAL_PUBLISH_BACKUP_DIR = `${LOCAL_PUBLISH_DIR}-backup`
let localPublishQueue = Promise.resolve()

const publishLocalSite = async (logger: Logger<string>, siteId: number) => {
  const outputDir = await mkdtemp(`${LOCAL_PUBLISH_DIR}-`)

  try {
    await new Promise<void>((resolve, reject) => {
      const child = spawn("pnpm", ["start"], {
        cwd: PUBLISHING_DIR,
        env: {
          // oxlint-disable-next-line node/no-process-env
          ...process.env,
          SITE_ID: String(siteId),
          OUTPUT_DIR: outputDir,
        },
        stdio: "inherit",
      })

      child.once("error", reject)
      child.once("exit", (code) => {
        if (code === 0) resolve()
        else reject(new Error(`Local publisher exited with code ${code}`))
      })
    })

    await copyFile(
      path.join(outputDir, "schema/_index.json"),
      path.join(outputDir, "schema/not-found.json"),
    )
    await rm(LOCAL_PUBLISH_BACKUP_DIR, { recursive: true, force: true })
    const hadPreviousPublish = existsSync(LOCAL_PUBLISH_DIR)
    if (hadPreviousPublish) {
      await rename(LOCAL_PUBLISH_DIR, LOCAL_PUBLISH_BACKUP_DIR)
    }
    try {
      await rename(outputDir, LOCAL_PUBLISH_DIR)
    } catch (error) {
      if (hadPreviousPublish) {
        await rename(LOCAL_PUBLISH_BACKUP_DIR, LOCAL_PUBLISH_DIR)
      }
      throw error
    }
    await rm(LOCAL_PUBLISH_BACKUP_DIR, { recursive: true, force: true })
    logger.info(
      { siteId },
      "Published site to the local template at http://localhost:3001",
    )
  } catch (error) {
    await rm(outputDir, { recursive: true, force: true })
    throw error
  }
}

export const publishSite = async (
  logger: Logger<string>,
  { siteId, codebuildJob }: PublishSiteArgs,
) => {
  if (env.NEXT_PUBLIC_APP_ENV === "development") {
    localPublishQueue = localPublishQueue
      .then(() => publishLocalSite(logger, siteId))
      .catch((error) => logger.error({ error, siteId }, "Local publish failed"))
    return
  }

  if (env.NEXT_PUBLIC_APP_ENV === "preview") {
    logger.info({ siteId }, "Preview env: skipping CodeBuild publish")
    return
  }

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
