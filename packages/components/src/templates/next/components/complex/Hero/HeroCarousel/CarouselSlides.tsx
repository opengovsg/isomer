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
  base: "absolute inset-0 z-0 h-full w-full opacity-0 transition-opacity duration-[400ms] ease-out motion-reduce:transition-none",
  variants: {
    isCurrent: {
      true: "z-10 opacity-100",
    },
  },
})

const slideContentStyles = tv({
  base: "pointer-events-none col-start-1 row-start-1 flex w-full flex-col gap-9 self-start opacity-0 transition-opacity duration-[400ms] ease-out motion-reduce:transition-none",
  variants: {
    isCurrent: {
      true: "pointer-events-auto relative z-10 opacity-100",
    },
    // From md, centre the title and CTAs together so a short slide isn't
    // pinned to the top of space reserved by a taller one.
    isVerticallyCentered: {
      true: "md:self-center",
    },
  },
})

export const CarouselLiveRegion = ({
  slides,
  currentIndex,
  politeness,
}: {
  slides: HeroCarouselSlideView[]
  currentIndex: number
  politeness: "off" | "polite"
}) => (
  <p className="sr-only" aria-live={politeness} aria-atomic="true">
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
  inactiveHeadingTag,
  titleClassName,
  actionsClassName,
  isVerticallyCenteredPerSlide = false,
}: {
  slides: HeroCarouselSlideView[]
  currentIndex: number
  headingTag: HeadingTag
  inactiveHeadingTag: HeadingTag
  titleClassName: string
  actionsClassName: string
  isVerticallyCenteredPerSlide?: boolean
}) => (
  <div className="grid">
    {slides.map((slide, index) => {
      const isCurrent = index === currentIndex
      const SlideTag = isCurrent ? Tag : inactiveHeadingTag

      return (
        <div
          key={index}
          className={slideContentStyles({
            isCurrent,
            isVerticallyCentered: isVerticallyCenteredPerSlide,
          })}
          role="group"
          aria-roledescription="slide"
          aria-label={`${index + 1} of ${slides.length}`}
          {...(isCurrent ? {} : { inert: "" })}
        >
          <div className="flex flex-col gap-6">
            <SlideTag className={titleClassName}>{slide.title}</SlideTag>
            {slide.subtitle && (
              <p className="prose-title-lg-regular">{slide.subtitle}</p>
            )}
          </div>
          <SlideActions slide={slide} className={actionsClassName} />
        </div>
      )
    })}
  </div>
)
