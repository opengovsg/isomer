import { Card, CardImg, Col } from "@govtechsg/sgds-react";

import type { InfoCardsProps } from "~/interfaces";
import type { SingleCardProps } from "~/interfaces/complex/InfoCards";
import { HomepageSectionWrapper } from "../HomepageSectionWrapper";

const SingleCard = ({
  title,
  imageUrl,
  description: text,
}: Omit<SingleCardProps, "imageAlt" | "url">) => (
  <Card>
    <CardImg alt={title} src={imageUrl} variant="top" />
    <Card.Body>
      <Card.Title>{title}</Card.Title>
      <Card.Text>{text}</Card.Text>
      <Card.Link href="#">Go somewhere</Card.Link>
    </Card.Body>
  </Card>
);

const InfoCards = ({ sectionIdx, cards }: InfoCardsProps) => {
  return (
    <HomepageSectionWrapper sectionIndex={sectionIdx}>
      <Col lg="4" xs="12">
        {cards.map((card, idx) => {
          const elementKey = `info-card-${idx}-${card.title}`;
          const { title, description: text, imageUrl } = card;
          return (
            <SingleCard
              key={elementKey}
              title={title}
              description={text}
              imageUrl={imageUrl}
            />
          );
        })}
      </Col>
    </HomepageSectionWrapper>
  );
};

export default InfoCards;
