import { BuildStatusType } from "@prisma/client"
import { z } from "zod"

/**
 * Extract the build ID from the ARN string. When eventbridge sends the ARN,
 * it is in the format: arn:aws:codebuild:region:account-id:build/build-id
 * The build ID is the part after "build/", which is the part returned by
 * startProjectById in codebuild.service.ts, and is saved in the database
 * We only require the build ID for our processing, and can ignore the rest of the ARN
 * @param arn The ARN string to extract the build ID from
 * @returns The extracted build ID, or null if not found
 */
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
    status: z.nativeEnum(BuildStatusType),
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
