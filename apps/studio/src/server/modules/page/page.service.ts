import type pino from "pino"
import type { UnwrapTagged } from "type-fest"
import {
  DEFAULT_CHILDREN_PAGES_BLOCK,
  ISOMER_USABLE_PAGE_LAYOUTS,
} from "@opengovsg/isomer-components"
import { format } from "date-fns"

import type { ScheduledPublishJobData } from "~/server/bullmq/queues/schedule-publish"
import {
  getJobIdFromResourceIdAndScheduledAt,
  getJobOptionsFromScheduledAt,
  scheduledPublishQueue,
} from "~/server/bullmq/queues/schedule-publish"

export const createDefaultPage = ({
  layout,
}: {
  layout: "content" | "article"
}) => {
  switch (layout) {
    case "content": {
      const contentDefaultPage = {
        layout: ISOMER_USABLE_PAGE_LAYOUTS.Content,
        page: {
          contentPageHeader: {
            summary: "This is the page summary",
          },
        },
        content: [],
        version: "0.1.0",
      } satisfies UnwrapTagged<PrismaJson.BlobJsonContent>
      return contentDefaultPage
    }

    case "article": {
      const articleDefaultPage = {
        layout: ISOMER_USABLE_PAGE_LAYOUTS.Article,
        page: {
          date: format(new Date(), "dd/MM/yyyy"),
          category: "Feature Articles",
          articlePageHeader: {
            summary: "This is the page summary",
          },
        },
        content: [],
        version: "0.1.0",
      } satisfies UnwrapTagged<PrismaJson.BlobJsonContent>

      return articleDefaultPage
    }
  }
}

export const createFolderIndexPage = (title: string) => {
  return {
    version: "0.1.0",
    layout: ISOMER_USABLE_PAGE_LAYOUTS.Index,
    // NOTE: cannot use placeholder values here
    // because this are used for generation of breadcrumbs
    // and the page title
    page: {
      title,
      lastModified: new Date().toISOString(),
      contentPageHeader: {
        summary: `Pages in ${title}`,
      },
    },
    content: [DEFAULT_CHILDREN_PAGES_BLOCK],
  } satisfies UnwrapTagged<PrismaJson.BlobJsonContent>
}

/**
 * Schedules a publish job for a resource at a specified date
 * @param logger Pino logger instance
 * @param data Scheduled publish job data
 * @param scheduledAt The date at which the job should be processed
 */
export const schedulePublishResource = async (
  logger: pino.Logger<string>,
  data: ScheduledPublishJobData,
  scheduledAt: Date,
) => {
  await scheduledPublishQueue.add(
    "schedule-publish",
    data,
    getJobOptionsFromScheduledAt(data.resourceId.toString(), scheduledAt),
  )
  logger.info(
    { resourceId: data.resourceId, scheduledAt },
    "Scheduling new publish job",
  )
}

export const unschedulePublishResource = async (
  logger: pino.Logger<string>,
  resourceId: number,
  scheduledAt: Date,
) => {
  const jobId = getJobIdFromResourceIdAndScheduledAt(
    resourceId.toString(),
    scheduledAt,
  )
  const existingJob = await scheduledPublishQueue.getJob(jobId)
  if (existingJob) {
    logger.info({ resourceId }, "Removing scheduled publish job")
    await existingJob.remove()
  } else {
    logger.info(
      { resourceId },
      "No scheduled publish job found to remove, skipping",
    )
  }
}
