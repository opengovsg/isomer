import { z } from "zod"

export const getPresignedPutUrlSchema = z.object({
  siteId: z.number().min(1),
  fileName: z.string({
    required_error: "Missing file name",
  }),
})

// Reference: https://docs.aws.amazon.com/guardduty/latest/ug/monitor-with-eventbridge-s3-malware-protection.html
export const postFileScanResultSchema = z.object({
  detail: z.object({
    scanStatus: z.string(),
    s3ObjectDetails: z.object({
      objectKey: z.string(),
      bucketName: z.string(),
    }),
    scanResultDetails: z.object({
      scanResultStatus: z.string(),
      threats: z
        .array(
          z.object({
            name: z.string(),
          }),
        )
        .nullable(),
    }),
  }),
})

export const deleteAssetSchema = z.object({
  fileKey: z.string({
    required_error: "Missing file key",
  }),
})
