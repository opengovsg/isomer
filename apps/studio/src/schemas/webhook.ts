import { BuildStatusType } from "@prisma/client"
import { z } from "zod"

/**
 * Schema for CodeBuild webhook payload
 * NOTE: This schema MUST be kept in sync with the payload sent by EventBridge
 * when a codebuild build state changes
 */
export const codeBuildWebhookSchema = z.object({
  projectName: z.string(),
  siteId: z.number(),
  buildId: z.string(),
  buildNumber: z.number(),
  buildStatus: z.nativeEnum(BuildStatusType),
})
