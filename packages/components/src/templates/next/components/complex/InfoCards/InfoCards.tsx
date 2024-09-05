"use client"

import type { PropsWithChildren } from "react"
import { BiRightArrowAlt } from "react-icons/bi"

import type { InfoCardsProps } from "~/interfaces"
import type {
  SingleCardNoImageProps,
  SingleCardWithImageProps,
} from "~/interfaces/complex/InfoCards"
import { tv } from "~/lib/tv"
import { getReferenceLinkHref } from "~/utils"
import { groupFocusVisibleHighlightNonRac } from "~/utils/rac"
import { ComponentContent } from "../../internal/customCssClass"
import { Link } from "../../internal/Link"

const infoCardTitleStyle = tv({
  extend: groupFocusVisibleHighlightNonRac,
  base: "prose-headline-lg-semibold text-base-content-strong",
  variants: {
    isClickableCard: {
      true: "group-hover:text-brand-canvas-inverse",
    },
  },
})

const createInfoCardsStyles = tv({
  slots: {
    container: `${ComponentContent} flex flex-col py-12 first:pt-0 lg:py-24`,
    headingContainer: "flex flex-col gap-2.5 pb-8 sm:pb-12 lg:max-w-3xl",
    headingTitle: "prose-display-md text-base-content-strong",
    headingSubtitle: "prose-headline-lg-regular text-base-content",
    grid: "grid grid-cols-1 gap-10 md:gap-7 lg:gap-x-16 lg:gap-y-12",
    cardContainer: "group flex flex-col gap-5 outline-0",
    cardImageContainer:
      "h-[11.875rem] w-full overflow-hidden rounded-lg border border-base-divider-subtle drop-shadow-none transition ease-in md:h-52",
    cardImage: "h-full w-full object-center",
    cardTextContainer: "flex flex-col gap-2.5 sm:gap-3",
    cardTitleArrow:
      "mb-0.5 ml-1 inline h-auto w-6 transition ease-in group-hover:translate-x-1",
    cardDescription: "prose-body-base text-base-content",
  },
  variants: {
    isClickableCard: {
      true: {
        cardImageContainer: "group-hover:drop-shadow-md",
      },
    },
    imageFit: {
      cover: {
        cardImage: "object-cover",
      },
      contain: {
        cardImage: "object-contain",
      },
    },
    maxColumns: {
      1: {
        grid: "",
      },
      2: {
        grid: "md:grid-cols-2",
      },
      3: {
        grid: "md:grid-cols-2 lg:grid-cols-3",
      },
    },
  },
  defaultVariants: {
    maxColumns: 3,
    imageFit: "cover",
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
  site,
  LinkComponent,
  children,
}: PropsWithChildren<
  Pick<SingleCardNoImageProps, "url" | "site" | "LinkComponent">
>): JSX.Element => {
  return url ? (
    <Link
      href={getReferenceLinkHref(url, site.siteMap)}
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
  imageFit,
  url,
}: Pick<
  SingleCardWithImageProps,
  "imageUrl" | "imageAlt" | "url" | "imageFit"
>): JSX.Element => (
  <div
    className={compoundStyles.cardImageContainer({ isClickableCard: !!url })}
  >
    <img
      src={imageUrl}
      alt={imageAlt}
      className={compoundStyles.cardImage({
        imageFit,
      })}
    />
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
    <h4 className={infoCardTitleStyle({ isClickableCard: !!url })}>
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
  site,
  LinkComponent,
}: SingleCardNoImageProps): JSX.Element => {
  return (
    <InfoCardContainer url={url} site={site} LinkComponent={LinkComponent}>
      <InfoCardText title={title} description={description} url={url} />
    </InfoCardContainer>
  )
}

const InfoCardWithImage = ({
  title,
  description,
  imageUrl,
  imageAlt,
  imageFit,
  url,
  site,
  LinkComponent,
}: SingleCardWithImageProps): JSX.Element => {
  return (
    <InfoCardContainer url={url} site={site} LinkComponent={LinkComponent}>
      <InfoCardImage
        imageFit={imageFit}
        imageUrl={imageUrl}
        imageAlt={imageAlt}
        url={url}
      />
      <InfoCardText title={title} description={description} url={url} />
    </InfoCardContainer>
  )
}

const InfoCards = ({
  title,
  subtitle,
  variant,
  cards,
  maxColumns,
  site,
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
                site={site}
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
                site={site}
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

      <div className={compoundStyles.grid({ maxColumns })}>
        <InfoCardtoRender />
      </div>
    </section>
  )
}

export default InfoCards
