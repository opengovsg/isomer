export interface InfoBox {
  title: string
  description?: string
}

export interface InfoColsProps {
  sectionIdx?: number
  title: string
  subtitle?: string
  buttonLabel?: string
  buttonUrl?: string
  infoBoxes: InfoBox[] // 1-4 info boxes
}

export default InfoColsProps
