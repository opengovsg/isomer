import { Card, CardImg, Col } from "@govtechsg/sgds-react"
import "@govtechsg/sgds/css/sgds.css"
import { HomepageSectionWrapper } from "../HomepageSectionWrapper"

export interface SingleCardProps {
  title: string
  imageUrl: string
  text: string
}

export interface InfoCardsProps {
  sectionIdx: number
  count: number
  cards: SingleCardProps[]
}

const SingleCard = ({ title, imageUrl, text }: SingleCardProps) => (
  <Card>
    <CardImg alt={title} src={imageUrl} variant="top" />
    <Card.Body>
      <Card.Title>{title}</Card.Title>
      <Card.Text>{text}</Card.Text>
      <Card.Link href="#">Go somewhere</Card.Link>
    </Card.Body>
  </Card>
)

const InfoCards = ({ sectionIdx, count, cards }: InfoCardsProps) => {
  return (
    <HomepageSectionWrapper sectionIndex={sectionIdx}>
      <Col lg="4" xs="12">
        {cards.map((card) => {
          const elementKey = `info-card-${count}-${card.title}`
          const { title, text, imageUrl } = card
          return (
            <SingleCard
              key={elementKey}
              title={title}
              text={text}
              imageUrl={imageUrl}
            />
          )
        })}
      </Col>
    </HomepageSectionWrapper>
  )
}

export default InfoCards
export { InfoCards }
