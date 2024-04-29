import type { BaseIsomerComponent } from "./base"

export const CalloutVariants = [
  "info",
  "success",
  "warning",
  "critical",
] as const
export type CalloutVariant = (typeof CalloutVariants)[number]

export interface CalloutProps extends BaseIsomerComponent {
  type: "callout"
  content: string
  variant: CalloutVariant
}

export default CalloutProps
