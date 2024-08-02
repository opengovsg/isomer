import { BiRightArrowAlt } from "react-icons/bi"
import { tv } from "tailwind-variants"

import type { InfoCardsProps } from "~/interfaces"
import type {
  SingleCardNoImageProps,
  SingleCardWithImageProps,
} from "~/interfaces/complex/InfoCards"
import { ComponentContent } from "../../internal/customCssClass"
import { Link } from "../../internal/Link"

const createInfoCardsStyles = tv({
  slots: {
    container: `${ComponentContent} mx-auto flex flex-col py-12 lg:py-24`,
    headingContainer: "flex flex-col gap-2.5 pb-8 sm:pb-12 lg:max-w-3xl",
    headingTitle: "strong prose-display-md text-base-content-strong",
    headingSubtitle: "prose-headline-lg-regular text-base-content",
    grid: "grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-7 lg:grid-cols-3 lg:gap-x-16 lg:gap-y-12",
    cardContainer: "group flex flex-col gap-5 outline-offset-4",
    cardImageContainer:
      "h-[11.875rem] w-full overflow-hidden rounded-lg md:h-52",
    cardImage: "h-full w-full object-cover object-center",
    cardTextContainer: "flex flex-col gap-3",
    cardTitle: "text-base-content-strong text-heading-04",
    cardTitleArrow: "mb-1 ml-1.5 inline transition group-hover:translate-x-1",
    cardDescription: "prose-body-base line-clamp-4 text-base-content",
  },
  variants: {
    isClickableCard: {
      true: {
        cardTitle: "group-hover:text-brand-canvas-inverse",
      },
    },
  },
})

const compoundStyles = createInfoCardsStyles()

const InfoCardsHeadingSection = ({
  title,
  subtitle,
}: Pick<InfoCardsProps, "title" | "subtitle">) => (
  <div className={compoundStyles.headingContainer()}>
    <h2 className={compoundStyles.headingTitle()}>{title}</h2>

    {subtitle && <p className={compoundStyles.headingSubtitle()}>{subtitle}</p>}
  </div>
)

const InfoCardImage = ({
  imageUrl,
  imageAlt,
}: Pick<SingleCardWithImageProps, "imageUrl" | "imageAlt">) => (
  <div className={compoundStyles.cardImageContainer()}>
    <img src={imageUrl} alt={imageAlt} className={compoundStyles.cardImage()} />
  </div>
)

const InfoCardText = ({
  title,
  description,
  url,
}: Pick<SingleCardWithImageProps, "title" | "description" | "url">) => (
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
}: SingleCardNoImageProps) => {
  return url ? (
    <Link
      href={url}
      className={compoundStyles.cardContainer()}
      LinkComponent={LinkComponent}
    >
      <InfoCardText title={title} description={description} url={url} />
    </Link>
  ) : (
    <div className={compoundStyles.cardContainer()}>
      <InfoCardText title={title} description={description} url={url} />
    </div>
  )
}

const InfoCardWithImage = ({
  title,
  description,
  imageUrl,
  imageAlt,
  url,
  LinkComponent,
}: SingleCardWithImageProps) => {
  return url ? (
    <Link
      href={url}
      className={compoundStyles.cardContainer()}
      LinkComponent={LinkComponent}
    >
      <InfoCardImage imageUrl={imageUrl} imageAlt={imageAlt} />
      <InfoCardText title={title} description={description} url={url} />
    </Link>
  ) : (
    <div className={compoundStyles.cardContainer()}>
      <InfoCardImage imageUrl={imageUrl} imageAlt={imageAlt} />
      <InfoCardText title={title} description={description} url={url} />
    </div>
  )
}

const InfoCards = ({
  title,
  subtitle,
  isCardsWithImages,
  cards,
  LinkComponent,
}: InfoCardsProps) => (
  <section className={compoundStyles.container()}>
    <InfoCardsHeadingSection title={title} subtitle={subtitle} />

    <div className={compoundStyles.grid()}>
      {isCardsWithImages
        ? cards.map((card, idx) => (
            <InfoCardWithImage
              key={idx}
              {...card}
              LinkComponent={LinkComponent}
            />
          ))
        : cards.map((card, idx) => (
            <InfoCardNoImage
              key={idx}
              {...card}
              LinkComponent={LinkComponent}
            />
          ))}
    </div>
  </section>
)

export default InfoCards
