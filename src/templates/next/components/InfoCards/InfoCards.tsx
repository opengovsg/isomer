import { InfoCardsProps } from "~/common"
import Card from "../shared/Card"
import { getHeadingStyles } from "../../typography/Heading"

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
      <h3 className={`${getHeadingStyles(3, "md")} text-content-strong`}>
        {title}
      </h3>
      {subtitle && (
        <p className="text-content text-sm sm:text-lg">{subtitle}</p>
      )}
    </div>
  )
}

const InfoCards = ({ cards, title, subtitle, variant }: InfoCardsProps) => {
  return (
    <section className={`py-12 px-5 lg:py-24 lg:px-10`}>
      {variant === "side" ? (
        <div
          className={`flex flex-col lg:flex-row gap-12 items-center mx-auto lg:max-w-screen-2xl`}
        >
          <TitleSection
            title={title}
            subtitle={subtitle}
            className="lg:max-w-60"
          />
          <div
            className={`grid grid-cols-1 lg:grid-cols-3 gap-8 md:hidden lg:grid`}
          >
            {cards.map((card) => (
              <Card
                title={card.title}
                imageUrl={card.imageUrl}
                text={card.text}
                imageAlt={card.imageAlt}
                buttonLabel={card.buttonLabel}
                buttonUrl={card.buttonLabel}
                variant="vertical"
              ></Card>
            ))}
          </div>
          <div className={`hidden grid-cols-1 gap-8 md:grid lg:hidden`}>
            {cards.map((card) => (
              <Card
                title={card.title}
                imageUrl={card.imageUrl}
                text={card.text}
                imageAlt={card.imageAlt}
                buttonLabel={card.buttonLabel}
                buttonUrl={card.buttonLabel}
                variant="horizontal"
              ></Card>
            ))}
          </div>
        </div>
      ) : (
        <div
          className={`flex flex-col gap-12 items-center mx-auto lg:max-w-5xl`}
        >
          <TitleSection title={title} subtitle={subtitle} />
          <div
            className={`grid grid-cols-1 md:grid-cols-3 gap-8 sm:hidden md:grid`}
          >
            {cards.map((card) => (
              <Card
                title={card.title}
                imageUrl={card.imageUrl}
                text={card.text}
                imageAlt={card.imageAlt}
                buttonLabel={card.buttonLabel}
                buttonUrl={card.buttonLabel}
                variant="vertical"
              ></Card>
            ))}
          </div>
          <div className={`hidden grid-cols-1 gap-8 sm:grid md:hidden`}>
            {cards.map((card) => (
              <Card
                title={card.title}
                imageUrl={card.imageUrl}
                text={card.text}
                imageAlt={card.imageAlt}
                buttonLabel={card.buttonLabel}
                buttonUrl={card.buttonLabel}
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
