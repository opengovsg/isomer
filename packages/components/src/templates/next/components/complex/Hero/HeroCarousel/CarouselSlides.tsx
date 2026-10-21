import type { HeadingTag } from "~/utils/getHeadingTag"
import { tv } from "~/lib/tv"

import { ImageClient } from "../../../internal/ImageClient"
import { LinkButton } from "../../../internal/LinkButton/LinkButton"

export interface HeroCarouselSlideView {
  backgroundUrl: string
  title: string
  subtitle?: string
  primaryLabel?: string
  primaryHref?: string
  secondaryLabel?: string
  secondaryHref?: string
}

const slideImageStyles = tv({
  base: "absolute inset-0 z-0 h-full w-full opacity-0 transition-opacity duration-150 ease-out motion-reduce:transition-none",
  variants: {
    isCurrent: {
      true: "z-10 opacity-100",
    },
  },
})

const slideContentStyles = tv({
  base: "col-start-1 row-start-1 flex w-full flex-col gap-6 self-start opacity-0 transition-opacity duration-150 ease-out motion-reduce:transition-none",
  variants: {
    isCurrent: {
      true: "relative z-10 opacity-100",
    },
    isHidden: {
      true: "pointer-events-none",
    },
  },
})

export const CarouselLiveRegion = ({
  slides,
  currentIndex,
}: {
  slides: HeroCarouselSlideView[]
  currentIndex: number
}) => (
  <p className="sr-only" aria-live="polite" aria-atomic="true">
    {slides[currentIndex]
      ? `Slide ${currentIndex + 1} of ${slides.length}: ${slides[currentIndex].title}`
      : ""}
  </p>
)

export const CarouselSlideImages = ({
  slides,
  currentIndex,
  assetsBaseUrl,
}: {
  slides: HeroCarouselSlideView[]
  currentIndex: number
  assetsBaseUrl?: string
}) =>
  slides.map((slide, index) => {
    const isCurrent = index === currentIndex

    return (
      <div
        key={slide.backgroundUrl + index}
        className={slideImageStyles({ isCurrent })}
        aria-hidden={!isCurrent}
      >
        <ImageClient
          src={slide.backgroundUrl}
          alt=""
          width="100%"
          className="absolute inset-0 h-full w-full object-cover object-center"
          assetsBaseUrl={assetsBaseUrl}
          lazyLoading={index === 0 ? false : true}
        />
      </div>
    )
  })

const SlideActions = ({
  slide,
  className,
}: {
  slide: HeroCarouselSlideView
  className: string
}) =>
  slide.primaryLabel && slide.primaryHref ? (
    <div className={className}>
      <LinkButton
        href={slide.primaryHref}
        size="lg"
        variant="solid"
        // TODO: non-inverse color schemes are not supported yet
        colorScheme="inverse"
        isWithFocusVisibleHighlight
      >
        {slide.primaryLabel}
      </LinkButton>
      {slide.secondaryLabel && slide.secondaryHref && (
        <LinkButton
          colorScheme="inverse"
          variant="outline"
          size="lg"
          href={slide.secondaryHref}
          isWithFocusVisibleHighlight
        >
          {slide.secondaryLabel}
        </LinkButton>
      )}
    </div>
  ) : null

export const CarouselSlideContent = ({
  slides,
  currentIndex,
  headingTag: Tag,
  titleClassName,
  actionsClassName,
  isVerticallyCenteredPerSlide = false,
}: {
  slides: HeroCarouselSlideView[]
  currentIndex: number
  headingTag: HeadingTag
  titleClassName: string
  actionsClassName: string
  // From md up, each slide's title and CTAs are centered as one block, so a
  // slide without CTAs isn't pushed up by space reserved for other slides'
  isVerticallyCenteredPerSlide?: boolean
}) => {
  const title = (slide: HeroCarouselSlideView) => (
    <div className="flex flex-col gap-6">
      <Tag className={titleClassName}>{slide.title}</Tag>
      {slide.subtitle && (
        <p className="prose-title-lg-regular">{slide.subtitle}</p>
      )}
    </div>
  )

  if (isVerticallyCenteredPerSlide) {
    return (
      <div className="grid">
        {slides.map((slide, index) => {
          const isCurrent = index === currentIndex

          return (
            <div
              key={index}
              className={slideContentStyles({
                isCurrent,
                isHidden: !isCurrent,
                className: "gap-9 md:self-center",
              })}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${slides.length}`}
              {...(isCurrent ? {} : { inert: "" })}
            >
              {title(slide)}
              <SlideActions slide={slide} className={actionsClassName} />
            </div>
          )
        })}
      </div>
    )
  }

  // Skip the CTA row (and its gap) entirely when no slide has one, otherwise
  // it leaves empty space below the title
  const hasActions = slides.some((s) => s.primaryLabel && s.primaryHref)

  return (
    <>
      <div className="grid">
        {slides.map((slide, index) => {
          const isCurrent = index === currentIndex

          return (
            <div
              key={index}
              className={slideContentStyles({
                isCurrent,
                isHidden: !isCurrent,
              })}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${slides.length}`}
              {...(isCurrent ? {} : { inert: "" })}
            >
              {title(slide)}
            </div>
          )
        })}
      </div>

      {hasActions && (
        <div className="grid min-h-[3rem]">
          {slides.map((slide, index) => {
            const isCurrent = index === currentIndex

            return (
              <div
                key={index}
                className={slideContentStyles({
                  isCurrent,
                  isHidden: !isCurrent,
                })}
                {...(isCurrent ? {} : { inert: "" })}
              >
                <SlideActions slide={slide} className={actionsClassName} />
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
