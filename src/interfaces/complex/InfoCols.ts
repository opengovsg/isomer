import { SupportedIconName } from "~/common/icons"

export interface InfoBox {
  icon?: SupportedIconName
  title: string
  description?: string
  buttonLabel?: string
  buttonUrl?: string
}

export interface InfoColsProps {
  type: "infocols"
  sectionIdx?: number
  backgroundColor?: "white" | "gray"
  title: string
  subtitle?: string
  buttonLabel?: string
  buttonUrl?: string
  infoBoxes: InfoBox[] // 1-4 info boxes
  LinkComponent?: any
}
