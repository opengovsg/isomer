import type { InfoCardsProps } from "~/interfaces"
import Card from "../../internal/Card"
import { Heading } from "../../../typography/Heading"
import { ComponentContent } from "../../internal/customCssClass"

const TitleSection = ({
  title,
  subtitle,
  className = "",
}: {
  title: InfoCardsProps["title"]
  subtitle: InfoCardsProps["subtitle"]
  className?: string
}) => {
  return (
    <div className={`flex flex-col gap-8 self-start max-w-3xl ${className}`}>
      <h3 className={`${Heading[3]} text-content-strong`}>{title}</h3>
      {subtitle && (
        <p className="text-content text-sm sm:text-lg">{subtitle}</p>
      )}
    </div>
  )
}

const InfoCards = ({ cards, title, subtitle, variant }: InfoCardsProps) => {
  return (
    <section>
      {variant === "side" ? (
        <div
          className={`${ComponentContent} py-12 lg:py-24 flex flex-col lg:flex-row gap-12 items-center mx-auto`}
        >
          <TitleSection
            title={title}
            subtitle={subtitle}
            className="lg:max-w-60"
          />
          <div
            className={`grid grid-cols-1 lg:grid-cols-3 gap-8 md:max-lg:hidden`}
          >
            {cards.map((card) => (
              <Card
                title={card.title}
                url={card.url}
                imageUrl={card.imageUrl}
                description={card.description}
                imageAlt={card.imageAlt}
                buttonLabel={card.buttonLabel}
                variant="vertical"
              ></Card>
            ))}
          </div>
          <div className={`hidden grid-cols-1 gap-8 md:max-lg:grid`}>
            {cards.map((card) => (
              <Card
                title={card.title}
                url={card.url}
                imageUrl={card.imageUrl}
                description={card.description}
                imageAlt={card.imageAlt}
                buttonLabel={card.buttonLabel}
                variant="horizontal"
              ></Card>
            ))}
          </div>
        </div>
      ) : (
        <div
          className={`${ComponentContent} py-12 lg:py-24 flex flex-col gap-12 items-center mx-auto`}
        >
          <TitleSection title={title} subtitle={subtitle} />
          <div
            className={`grid grid-cols-1 lg:grid-cols-3 gap-8 sm:max-lg:hidden`}
          >
            {cards.map((card) => (
              <Card
                title={card.title}
                url={card.url}
                imageUrl={card.imageUrl}
                description={card.description}
                imageAlt={card.imageAlt}
                buttonLabel={card.buttonLabel}
                variant="vertical"
              ></Card>
            ))}
          </div>
          <div className={`hidden grid-cols-1 gap-8 sm:max-lg:grid`}>
            {cards.map((card) => (
              <Card
                title={card.title}
                url={card.url}
                imageUrl={card.imageUrl}
                description={card.description}
                imageAlt={card.imageAlt}
                buttonLabel={card.buttonLabel}
                variant="horizontal"
              ></Card>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

export default InfoCards
