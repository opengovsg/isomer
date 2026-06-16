import { z } from "zod"

export const PREVIEW_LINK_EXPIRY_CHOICES = ["24h", "3d", "7d"] as const
export type PreviewLinkExpiryChoice =
  (typeof PREVIEW_LINK_EXPIRY_CHOICES)[number]

export const PREVIEW_LINK_LABEL_MAX_LENGTH = 80

export const mintPreviewLinkSchema = z.object({
  siteId: z.number().int().positive(),
  resourceId: z.number().int().positive(),
  expiryChoice: z.enum(PREVIEW_LINK_EXPIRY_CHOICES, {
    message: "Pick an expiry of 24h, 3d, or 7d.",
  }),
  label: z
    .string()
    .max(PREVIEW_LINK_LABEL_MAX_LENGTH, {
      message: `Label must be ${PREVIEW_LINK_LABEL_MAX_LENGTH} characters or fewer.`,
    })
    .optional()
    .nullable(),
})

export type MintPreviewLinkInput = z.infer<typeof mintPreviewLinkSchema>

export const revokePreviewLinkSchema = z.object({
  linkId: z.string().min(1, {
    message: "Provide the preview link id to revoke",
  }),
})

export const listPagePreviewLinksSchema = z.object({
  siteId: z.number().int().positive(),
  resourceId: z.number().int().positive(),
})

export const PREVIEW_LINK_STATUS_FILTERS = [
  "active",
  "expired",
  "revoked",
  "all",
] as const
export type PreviewLinkStatusFilter =
  (typeof PREVIEW_LINK_STATUS_FILTERS)[number]

export const listSitePreviewLinksSchema = z.object({
  siteId: z.number().int().positive(),
  status: z.enum(PREVIEW_LINK_STATUS_FILTERS).default("active"),
})
