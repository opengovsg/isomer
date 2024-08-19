import type { PropsWithChildren } from "react"
import { BiRightArrowAlt } from "react-icons/bi"

import type { InfoCardsProps } from "~/interfaces"
import type {
  SingleCardNoImageProps,
  SingleCardWithImageProps,
} from "~/interfaces/complex/InfoCards"
import { tv } from "~/lib/tv"
import { ComponentContent } from "../../internal/customCssClass"
import { Link } from "../../internal/Link"

const createInfoCardsStyles = tv({
  slots: {
    container: `${ComponentContent} mx-auto flex flex-col py-12 first:pt-0 lg:py-24`,
    headingContainer: "flex flex-col gap-2.5 pb-8 sm:pb-12 lg:max-w-3xl",
    headingTitle: "prose-display-md text-base-content-strong",
    headingSubtitle: "prose-headline-lg-regular text-base-content",
    grid: "grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-7 lg:grid-cols-3 lg:gap-x-16 lg:gap-y-12",
    cardContainer: "group flex flex-col gap-5 outline-offset-4",
    cardImageContainer:
      "h-[11.875rem] w-full overflow-hidden rounded-lg border border-base-divider-subtle drop-shadow-none transition ease-in md:h-52",
    cardImage: "h-full w-full object-cover object-center",
    cardTextContainer: "flex flex-col gap-2.5 sm:gap-3",
    cardTitle: "prose-headline-lg-semibold text-base-content-strong",
    cardTitleArrow:
      "mb-0.5 ml-1 inline h-auto w-6 transition ease-in group-hover:translate-x-1",
    cardDescription: "prose-body-base text-base-content",
  },
  variants: {
    isClickableCard: {
      true: {
        cardTitle: "group-hover:text-brand-canvas-inverse",
        cardImageContainer: "group-hover:drop-shadow-md",
      },
    },
  },
})

const compoundStyles = createInfoCardsStyles()

const InfoCardsHeadingSection = ({
  title,
  subtitle,
}: Pick<InfoCardsProps, "title" | "subtitle">): JSX.Element => (
  <div className={compoundStyles.headingContainer()}>
    <h2 className={compoundStyles.headingTitle()}>{title}</h2>

    {subtitle && <p className={compoundStyles.headingSubtitle()}>{subtitle}</p>}
  </div>
)

const InfoCardContainer = ({
  url,
  LinkComponent,
  children,
}: PropsWithChildren<
  Pick<SingleCardNoImageProps, "url" | "LinkComponent">
>): JSX.Element => {
  return url ? (
    <Link
      href={url}
      className={compoundStyles.cardContainer()}
      LinkComponent={LinkComponent}
    >
      {children}
    </Link>
  ) : (
    <div className={compoundStyles.cardContainer()}>{children}</div>
  )
}

const InfoCardImage = ({
  imageUrl,
  imageAlt,
  url,
}: Pick<
  SingleCardWithImageProps,
  "imageUrl" | "imageAlt" | "url"
>): JSX.Element => (
  <div
    className={compoundStyles.cardImageContainer({ isClickableCard: !!url })}
  >
    <img src={imageUrl} alt={imageAlt} className={compoundStyles.cardImage()} />
  </div>
)

const InfoCardText = ({
  title,
  description,
  url,
}: Pick<
  SingleCardWithImageProps,
  "title" | "description" | "url"
>): JSX.Element => (
  <div className={compoundStyles.cardTextContainer()}>
    <h4 className={compoundStyles.cardTitle({ isClickableCard: !!url })}>
      {title}

      {url && (
        <BiRightArrowAlt
          aria-hidden
          className={compoundStyles.cardTitleArrow()}
        />
      )}
    </h4>
    <p className={compoundStyles.cardDescription()}>{description}</p>
  </div>
)

const InfoCardNoImage = ({
  title,
  description,
  url,
  LinkComponent,
}: SingleCardNoImageProps): JSX.Element => {
  return (
    <InfoCardContainer url={url} LinkComponent={LinkComponent}>
      <InfoCardText title={title} description={description} url={url} />
    </InfoCardContainer>
  )
}

const InfoCardWithImage = ({
  title,
  description,
  imageUrl,
  imageAlt,
  url,
  LinkComponent,
}: SingleCardWithImageProps): JSX.Element => {
  return (
    <InfoCardContainer url={url} LinkComponent={LinkComponent}>
      <InfoCardImage imageUrl={imageUrl} imageAlt={imageAlt} url={url} />
      <InfoCardText title={title} description={description} url={url} />
    </InfoCardContainer>
  )
}

const InfoCards = ({
  title,
  subtitle,
  variant,
  cards,
  LinkComponent,
}: InfoCardsProps): JSX.Element => {
  const InfoCardtoRender = () => {
    switch (variant) {
      case "cardsWithImages":
        return (
          <>
            {cards.map((card, idx) => (
              <InfoCardWithImage
                key={idx}
                {...card}
                LinkComponent={LinkComponent}
              />
            ))}
          </>
        )
      case "cardsWithoutImages":
        return (
          <>
            {cards.map((card, idx) => (
              <InfoCardNoImage
                key={idx}
                {...card}
                LinkComponent={LinkComponent}
              />
            ))}
          </>
        )
      default:
        const _: never = variant
        return <></>
    }
  }

  return (
    <section className={compoundStyles.container()}>
      {(title || subtitle) && (
        <InfoCardsHeadingSection title={title} subtitle={subtitle} />
      )}

      <div className={compoundStyles.grid()}>
        <InfoCardtoRender />
      </div>
    </section>
  )
}

export default InfoCards
