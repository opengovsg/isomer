import { BuildStatusType } from "@prisma/client"
import { z } from "zod"

// Extract everything after "build/" from the ARN string
export const buildIdFromArn = (arn: string) => {
  const regex = /build\/(.+)$/
  const match = regex.exec(arn)
  return match ? match[1] : null
}

/**
 * Schema for CodeBuild webhook payload
 * NOTE: This schema MUST be kept in sync with the payload sent by EventBridge
 * when a codebuild build state changes
 */
export const codeBuildWebhookSchema = z
  .object({
    projectName: z.string(),
    siteId: z.coerce.number(),
    arn: z.string(),
    buildStatus: z.nativeEnum(BuildStatusType),
  })
  .transform(({ arn, ...rest }, ctx) => {
    const extractedBuildId = buildIdFromArn(arn)
    if (!extractedBuildId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid buildId format: ${arn}`,
      })
      return z.NEVER
    }
    return { ...rest, buildId: extractedBuildId }
  })
