export interface SingleCardProps {
  title: string
  url: string
  imageUrl: string
  imageAlt: string
  description?: string
  buttonLabel?: string
}

export interface InfoCardsProps {
  type: "infocards"
  sectionIdx?: number
  title?: string
  subtitle?: string
  variant: "side" | "top"
  cards: SingleCardProps[]
}

export default InfoCardsProps
