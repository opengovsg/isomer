export const CalloutVariants = [
  "info",
  "success",
  "warning",
  "critical",
] as const
export type CalloutVariant = (typeof CalloutVariants)[number]

export interface CalloutProps {
  type: "callout"
  content: string
  variant: CalloutVariant
}
