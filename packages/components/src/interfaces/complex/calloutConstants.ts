export const CALLOUT_VARIANT_OPTIONS = {
  Info: "info",
  Information: "information",
  GoodToKnow: "goodToKnow",
  Warning: "warning",
  Urgent: "urgent",
  Note: "note",
} as const

export type CalloutVariant =
  (typeof CALLOUT_VARIANT_OPTIONS)[keyof typeof CALLOUT_VARIANT_OPTIONS]

export const DEFAULT_CALLOUT_VARIANT = CALLOUT_VARIANT_OPTIONS.Information
