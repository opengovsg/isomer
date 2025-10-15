import type { Logger } from "pino"

import { getRedisWithRedlock, withRedlock } from "@isomer/redis"

import { SITE_REDIS_KEYSPACE } from "~/server/bullmq/queues/constants"
import { getSiteNameAndCodeBuildId } from "../site/site.service"
import {
  computeBuildChanges,
  startProjectById,
  updateCodejobsForSite,
} from "./utils"

const { redlock: SiteRedlockClient } = getRedisWithRedlock({
  keyspace: SITE_REDIS_KEYSPACE,
  bullmqCompatible: false,
})

export const publishSite = async (logger: Logger<string>, siteId: number) => {
  await withRedlock(
    SiteRedlockClient,
    siteId.toString(),
    async () => {
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
      if (!buildChanges.isNewBuildNeeded) {
        await updateCodejobsForSite({
          buildChanges,
          siteId,
        })
        return
      }

      // Step 3: Start a new build
      const startedBuild = await startProjectById(logger, codeBuildId)
      logger.info(
        {
          siteId,
          codeBuildId,
        },
        "Started new CodeBuild project run",
      )

      await updateCodejobsForSite({
        buildChanges: {
          ...buildChanges,
          startedBuild,
        },
        siteId,
      })
    },
    logger,
  )
}
