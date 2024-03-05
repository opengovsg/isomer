export interface SingleCardProps {
  title: string
  imageUrl: string
  text: string
}

export interface InfoCardsProps {
  sectionIdx: number
  cards: SingleCardProps[]
}

export default InfoCardsProps
