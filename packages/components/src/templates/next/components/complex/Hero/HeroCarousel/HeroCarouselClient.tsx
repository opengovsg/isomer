"use client"

import type { HeroCarouselProps } from "~/interfaces/complex/Hero"
import { useCallback, useState, useTransition } from "react"
import { BiChevronLeft, BiChevronRight } from "react-icons/bi"
import { HERO_CAROUSEL_SLIDE_MODE } from "~/interfaces/complex/Hero"
import { tv } from "~/lib/tv"
import { twMerge } from "~/lib/twMerge"
import { getHeadingTag } from "~/utils/getHeadingTag"
import { getReferenceLinkHref } from "~/utils/getReferenceLinkHref"

import { ImageClient } from "../../../internal/ImageClient"
import { LinkButton } from "../../../internal/LinkButton/LinkButton"

const HERO_THEME_MAPPINGS = {
  hero: {
    default: "bg-brand-canvas-inverse",
    inverse: "bg-brand-canvas-alt",
  },
  text: {
    default: "text-base-content-inverse",
    inverse: "text-base-content",
  },
  button: {
    default: "inverse",
    inverse: "default",
  },
} as const

const slideImageStyles = tv({
  base: "absolute inset-0 z-0 h-full w-full opacity-0 transition-opacity duration-150 ease-out motion-reduce:transition-none",
  variants: {
    isCurrent: {
      true: "z-10 opacity-100",
    },
  },
})

const slideContentStyles = tv({
  base: "flex flex-col gap-6 opacity-0 transition-opacity duration-150 ease-out motion-reduce:transition-none",
  variants: {
    isCurrent: {
      true: "relative z-10 opacity-100",
    },
    isHidden: {
      true: "pointer-events-none absolute inset-0",
    },
  },
})

type CarouselSlide = HeroCarouselProps["slides"][number]

type SlideContent = Pick<
  HeroCarouselProps,
  | "title"
  | "subtitle"
  | "buttonLabel"
  | "buttonUrl"
  | "secondaryButtonLabel"
  | "secondaryButtonUrl"
>

const getSlideContent = ({
  slideMode,
  rootContent,
  slide,
}: {
  slideMode: HeroCarouselProps["slide"]
  rootContent: SlideContent
  slide: CarouselSlide
}): SlideContent => {
  if (slideMode === HERO_CAROUSEL_SLIDE_MODE.imageOnly) {
    return rootContent
  }

  return {
    title: slide.title ?? rootContent.title,
    subtitle: slide.subtitle ?? rootContent.subtitle,
    buttonLabel: slide.buttonLabel ?? rootContent.buttonLabel,
    buttonUrl: slide.buttonUrl ?? rootContent.buttonUrl,
    secondaryButtonLabel:
      slide.secondaryButtonLabel ?? rootContent.secondaryButtonLabel,
    secondaryButtonUrl:
      slide.secondaryButtonUrl ?? rootContent.secondaryButtonUrl,
  }
}

const CarouselArrowButton = ({
  direction,
  onClick,
  isDisabled,
  className,
}: {
  direction: "prev" | "next"
  onClick: () => void
  isDisabled?: boolean
  className?: string
}) => {
  const Icon = direction === "prev" ? BiChevronLeft : BiChevronRight
  const label = direction === "prev" ? "Previous slide" : "Next slide"

  return (
    <button
      type="button"
      className={twMerge(
        "flex h-10 w-10 items-center justify-center rounded-full bg-white text-brand-canvas-inverse hover:bg-white/90 focus-visible:outline focus-visible:outline-[0.25rem] focus-visible:outline-offset-[0.125rem] focus-visible:outline-utility-highlight disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      aria-label={label}
      disabled={isDisabled}
      onClick={onClick}
    >
      <Icon className="h-6 w-6" aria-hidden />
    </button>
  )
}

const CarouselDots = ({
  count,
  currentIndex,
  onSelect,
  isClickable,
  className,
}: {
  count: number
  currentIndex: number
  onSelect: (index: number) => void
  isClickable: boolean
  className?: string
}) => (
  <div
    className={twMerge("flex items-center gap-2", className)}
    role={isClickable ? "tablist" : undefined}
    aria-label={isClickable ? "Carousel slides" : undefined}
  >
    {Array.from({ length: count }, (_, index) => {
      const isActive = index === currentIndex

      if (isClickable) {
        return (
          <button
            key={index}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={`Go to slide ${index + 1} of ${count}`}
            className={twMerge(
              "h-2 w-2 rounded-full transition-colors",
              isActive ? "bg-white" : "bg-white/40 hover:bg-white/60",
            )}
            onClick={() => onSelect(index)}
          />
        )
      }

      return (
        <span
          key={index}
          aria-hidden
          className={twMerge(
            "h-2 w-2 rounded-full",
            isActive ? "bg-white" : "bg-white/40",
          )}
        />
      )
    })}
  </div>
)

const CarouselControls = ({
  slideCount,
  currentIndex,
  onSelect,
  onPrev,
  onNext,
  isDotsClickable,
  isPending,
  className,
}: {
  slideCount: number
  currentIndex: number
  onSelect: (index: number) => void
  onPrev: () => void
  onNext: () => void
  isDotsClickable: boolean
  isPending: boolean
  className?: string
}) => (
  <div
    className={twMerge(
      "flex w-full items-center justify-between gap-4",
      className,
    )}
  >
    <CarouselDots
      count={slideCount}
      currentIndex={currentIndex}
      onSelect={onSelect}
      isClickable={isDotsClickable}
    />
    <div className="flex items-center gap-2">
      <CarouselArrowButton
        direction="prev"
        onClick={onPrev}
        isDisabled={isPending}
      />
      <CarouselArrowButton
        direction="next"
        onClick={onNext}
        isDisabled={isPending}
      />
    </div>
  </div>
)

export const HeroCarouselClient = ({
  title,
  subtitle,
  buttonLabel,
  buttonUrl,
  secondaryButtonLabel,
  secondaryButtonUrl,
  slides,
  slide: slideMode,
  site,
  theme = "default",
  headingLevel,
}: HeroCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPending, startTransition] = useTransition()

  const heroColour = HERO_THEME_MAPPINGS.hero[theme]
  const heroTextColour = HERO_THEME_MAPPINGS.text[theme]
  const heroButton = HERO_THEME_MAPPINGS.button[theme]
  const Tag = getHeadingTag(headingLevel)

  const rootContent: SlideContent = {
    title,
    subtitle,
    buttonLabel,
    buttonUrl,
    secondaryButtonLabel,
    secondaryButtonUrl,
  }

  const navigateToIndex = useCallback((index: number) => {
    startTransition(() => {
      setCurrentIndex(index)
    })
  }, [])

  const navigateByDirection = useCallback(
    (direction: "prev" | "next") => {
      startTransition(() => {
        setCurrentIndex((prev) => {
          const offset = direction === "next" ? 1 : -1
          return (prev + offset + slides.length) % slides.length
        })
      })
    },
    [slides.length],
  )

  if (slides.length < 2) {
    return null
  }

  const currentSlide = slides[currentIndex]
  if (!currentSlide) {
    return null
  }

  const isEntireSlideMode = slideMode === HERO_CAROUSEL_SLIDE_MODE.entire
  const activeContent = getSlideContent({
    slideMode,
    rootContent,
    slide: currentSlide,
  })
  const primaryButtonUrl = activeContent.buttonUrl
  const primaryButtonLabel = activeContent.buttonLabel

  const ctaButtons =
    primaryButtonLabel && primaryButtonUrl ? (
      <div className="flex flex-col justify-start gap-x-5 gap-y-4 sm:flex-row">
        <LinkButton
          href={getReferenceLinkHref(
            primaryButtonUrl,
            site.siteMapArray,
            site.assetsBaseUrl,
          )}
          size="lg"
          variant="solid"
          colorScheme={heroButton}
          isWithFocusVisibleHighlight
        >
          {primaryButtonLabel}
        </LinkButton>
        {activeContent.secondaryButtonLabel &&
          activeContent.secondaryButtonUrl && (
            <LinkButton
              colorScheme={heroButton}
              variant="outline"
              size="lg"
              href={getReferenceLinkHref(
                activeContent.secondaryButtonUrl,
                site.siteMapArray,
                site.assetsBaseUrl,
              )}
              isWithFocusVisibleHighlight
            >
              {activeContent.secondaryButtonLabel}
            </LinkButton>
          )}
      </div>
    ) : null

  return (
    <section
      className="flex min-h-[15rem] flex-col sm:min-h-[22.5rem] lg:min-h-[31.25rem] lg:flex-row"
      aria-roledescription="carousel"
      aria-label="Hero carousel"
    >
      <div
        className={`flex flex-col ${heroColour} px-6 pb-6 pt-11 md:px-10 lg:w-1/2 lg:justify-end lg:pb-12 lg:pl-10 lg:pr-8`}
      >
        <div
          className={`flex w-full max-w-[548px] flex-col justify-center gap-9 lg:mx-0 lg:ml-auto ${heroTextColour}`}
        >
          <div className="relative">
            {isEntireSlideMode ? (
              slides.map((slide, index) => {
                const content = getSlideContent({
                  slideMode,
                  rootContent,
                  slide,
                })
                const isCurrent = index === currentIndex

                return (
                  <div
                    key={index}
                    className={slideContentStyles({
                      isCurrent,
                      isHidden: !isCurrent,
                    })}
                    aria-hidden={!isCurrent}
                  >
                    <div className="flex flex-col gap-6">
                      <Tag className="wrap-break-word prose-display-xl text-balance">
                        {content.title}
                      </Tag>
                      {content.subtitle && (
                        <p className="prose-title-lg-regular">
                          {content.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="flex flex-col gap-6">
                <Tag className="wrap-break-word prose-display-xl text-balance">
                  {title}
                </Tag>
                {subtitle && (
                  <p className="prose-title-lg-regular">{subtitle}</p>
                )}
              </div>
            )}
          </div>

          {isEntireSlideMode ? (
            <div className="relative min-h-[3rem]">
              {slides.map((slide, index) => {
                const content = getSlideContent({
                  slideMode,
                  rootContent,
                  slide,
                })
                const isCurrent = index === currentIndex
                const slidePrimaryButtonUrl = content.buttonUrl
                const slidePrimaryButtonLabel = content.buttonLabel

                if (!slidePrimaryButtonLabel || !slidePrimaryButtonUrl) {
                  return null
                }

                return (
                  <div
                    key={index}
                    className={slideContentStyles({
                      isCurrent,
                      isHidden: !isCurrent,
                    })}
                    aria-hidden={!isCurrent}
                  >
                    <div className="flex flex-col justify-start gap-x-5 gap-y-4 sm:flex-row">
                      <LinkButton
                        href={getReferenceLinkHref(
                          slidePrimaryButtonUrl,
                          site.siteMapArray,
                          site.assetsBaseUrl,
                        )}
                        size="lg"
                        variant="solid"
                        colorScheme={heroButton}
                        isWithFocusVisibleHighlight
                      >
                        {slidePrimaryButtonLabel}
                      </LinkButton>
                      {content.secondaryButtonLabel &&
                        content.secondaryButtonUrl && (
                          <LinkButton
                            colorScheme={heroButton}
                            variant="outline"
                            size="lg"
                            href={getReferenceLinkHref(
                              content.secondaryButtonUrl,
                              site.siteMapArray,
                              site.assetsBaseUrl,
                            )}
                            isWithFocusVisibleHighlight
                          >
                            {content.secondaryButtonLabel}
                          </LinkButton>
                        )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            ctaButtons
          )}

          <CarouselControls
            className="mt-8 hidden lg:flex"
            slideCount={slides.length}
            currentIndex={currentIndex}
            onSelect={navigateToIndex}
            onPrev={() => navigateByDirection("prev")}
            onNext={() => navigateByDirection("next")}
            isDotsClickable
            isPending={isPending}
          />
        </div>
      </div>

      <div
        className="relative h-80 overflow-hidden lg:h-auto lg:max-h-full lg:min-h-[31.25rem] lg:w-1/2"
        style={{ contain: "layout" }}
      >
        {slides.map((slide, index) => {
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
                assetsBaseUrl={site.assetsBaseUrl}
                lazyLoading={index === 0 ? false : true}
              />
            </div>
          )
        })}

        <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/50 to-transparent px-6 pb-6 pt-10 lg:hidden">
          <CarouselControls
            slideCount={slides.length}
            currentIndex={currentIndex}
            onSelect={navigateToIndex}
            onPrev={() => navigateByDirection("prev")}
            onNext={() => navigateByDirection("next")}
            isDotsClickable={false}
            isPending={isPending}
          />
        </div>
      </div>
    </section>
  )
}
