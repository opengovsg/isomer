import type { BaseIsomerComponent } from "./base"

export interface InfobarProps extends BaseIsomerComponent {
  type: "infobar"
  sectionIdx?: number
  title: string
  subtitle?: string
  description?: string
  buttonLabel?: string
  buttonUrl?: string
  secondaryButtonLabel?: string
  secondaryButtonUrl?: string
  LinkComponent?: any // Next.js link
}

export default InfobarProps
