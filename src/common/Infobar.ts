export interface InfobarProps {
  type: "infobar"
  sectionIdx?: number
  title: string
  subtitle?: string
  description?: string
  buttonLabel?: string
  buttonUrl?: string
  secondaryButtonLabel?: string
  secondaryButtonUrl?: string
}

export default InfobarProps
