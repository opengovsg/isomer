import { BuildStatusType } from "@prisma/client"
import { z } from "zod"

// Extract everything after "build/" from the ARN string
const buildIdFromArn = (arn: string) => {
  const regex = /build\/(.+)$/
  const match = regex.exec(arn)
  return match ? match[1] : null
}

/**
 * Schema for CodeBuild webhook payload
 * NOTE: This schema MUST be kept in sync with the payload sent by EventBridge
 * when a codebuild build state changes
 */
export const codeBuildWebhookSchema = z.object({
  projectName: z.string(),
  siteId: z.coerce.number(),
  buildId: z.string().transform((val, ctx) => {
    const extractedBuildId = buildIdFromArn(val)
    if (!extractedBuildId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid buildId format: ${val}`,
      })
      return z.NEVER
    }
    return extractedBuildId
  }),
  buildStatus: z.nativeEnum(BuildStatusType),
})
