export const CalloutVariants = [
  "info",
  "success",
  "warning",
  "critical",
] as const
export type CalloutVariant = (typeof CalloutVariants)[number]

export interface CalloutProps {
  content: string
  variant: CalloutVariant
}

export default CalloutProps
