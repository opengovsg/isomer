export interface SingleCardProps {
  title: string
  imageUrl: string
  imageAlt?: string
  text?: string
  buttonLabel?: string
  buttonUrl?: string
}

export interface InfoCardsProps {
  type: "infocards"
  sectionIdx: number
  title?: string
  subtitle?: string
  variant: "side" | "top"
  cards: SingleCardProps[]
}

export default InfoCardsProps
