"use client"

import type { HeroCarouselProps } from "~/interfaces/complex/Hero"
import { useCallback, useState, useTransition } from "react"
import { BiChevronLeft, BiChevronRight } from "react-icons/bi"
import { HERO_CAROUSEL_STYLE } from "~/interfaces/complex/Hero"
import { tv } from "~/lib/tv"
import { twMerge } from "~/lib/twMerge"
import { getHeadingTag } from "~/utils/getHeadingTag"
import { getReferenceLinkHref } from "~/utils/getReferenceLinkHref"

import { ComponentContent } from "../../../internal/customCssClass"
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
        "flex h-10 w-10 items-center justify-center rounded-full border border-transparent bg-white text-base-content shadow-sm hover:bg-white/90 focus-visible:outline focus-visible:outline-[0.25rem] focus-visible:outline-offset-[0.125rem] focus-visible:outline-utility-highlight disabled:cursor-not-allowed disabled:opacity-50",
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

const carouselDotStyles = tv({
  base: "shrink-0 transition-[width,background-color,opacity] duration-150 ease-out motion-reduce:transition-none",
  variants: {
    layout: {
      /** Dots on the dark content panel (desktop) */
      content: "",
      /** Dots overlaid on the hero image (tablet/mobile) */
      overlay: "",
    },
    isActive: {
      true: "",
      false: "",
    },
  },
  compoundVariants: [
    {
      layout: "content",
      isActive: true,
      class: "h-2.5 w-2.5 rounded-full bg-white",
    },
    {
      layout: "content",
      isActive: false,
      class:
        "h-1.5 w-1.5 rounded-full bg-white/40 hover:bg-white/60 focus-visible:bg-white/60",
    },
    {
      layout: "overlay",
      isActive: true,
      class: "h-2 w-6 rounded-full bg-white",
    },
    {
      layout: "overlay",
      isActive: false,
      class: "h-2 w-2 rounded-full bg-white/50",
    },
  ],
})

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
}) => {
  const layout = isClickable ? "content" : "overlay"

  return (
    <div
      className={twMerge("flex items-center gap-2", className)}
      role={isClickable ? "tablist" : undefined}
      aria-label={isClickable ? "Carousel slides" : undefined}
    >
      {Array.from({ length: count }, (_, index) => {
        const isActive = index === currentIndex
        const dotClassName = carouselDotStyles({ layout, isActive })

        if (isClickable) {
          return (
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={`Go to slide ${index + 1} of ${count}`}
              className={dotClassName}
              onClick={() => onSelect(index)}
            />
          )
        }

        return <span key={index} aria-hidden className={dotClassName} />
      })}
    </div>
  )
}

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
  slides,
  style = HERO_CAROUSEL_STYLE.block,
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

  const isBlockStyle = style === HERO_CAROUSEL_STYLE.block
  const primaryButtonColorScheme = isBlockStyle ? heroButton : undefined
  const secondaryButtonColorScheme = isBlockStyle ? heroButton : "inverse"

  const images = slides.map((slide, index) => {
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
  })

  const mobileControls = (
    <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/50 to-transparent px-10 pb-10 pt-12 lg:hidden">
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
  )

  return (
    <section
      className={
        isBlockStyle
          ? "flex min-h-[15rem] flex-col sm:min-h-[22.5rem] lg:min-h-[31.25rem] lg:flex-row"
          : "relative flex min-h-[15rem] sm:min-h-[22.5rem] lg:min-h-[31.25rem]"
      }
      aria-roledescription="carousel"
      aria-label="Hero carousel"
    >
      {!isBlockStyle && (
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ contain: "layout" }}
        >
          {images}
        </div>
      )}
      <div
        className={
          isBlockStyle
            ? `flex flex-col ${heroColour} px-6 pb-6 pt-11 md:px-10 lg:w-1/2 lg:justify-end lg:pb-12 lg:pl-10 lg:pr-8`
            : "relative z-10 flex w-full flex-col justify-end bg-gradient-to-r from-[rgba(0,0,0,85%)] to-[rgba(0,0,0,10%)] xl:from-[rgba(0,0,0,100%)]"
        }
      >
        <div
          className={
            isBlockStyle
              ? `flex w-full max-w-[548px] flex-col justify-center gap-9 lg:mx-0 lg:ml-auto ${heroTextColour}`
              : `${ComponentContent} flex w-full flex-col gap-9 py-16 text-start text-base-content-inverse`
          }
        >
          <div className="relative">
            {slides.map((slide, index) => {
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
                    <Tag
                      className={
                        isBlockStyle
                          ? "wrap-break-word prose-display-xl text-balance"
                          : "prose-display-xl break-words"
                      }
                    >
                      {slide.title}
                    </Tag>
                    {slide.subtitle && (
                      <p className="prose-title-lg-regular">{slide.subtitle}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="relative min-h-[3rem]">
            {slides.map((slide, index) => {
              const isCurrent = index === currentIndex
              const slidePrimaryButtonUrl = slide.buttonUrl
              const slidePrimaryButtonLabel = slide.buttonLabel

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
                      colorScheme={primaryButtonColorScheme}
                      isWithFocusVisibleHighlight
                    >
                      {slidePrimaryButtonLabel}
                    </LinkButton>
                    {slide.secondaryButtonLabel && slide.secondaryButtonUrl && (
                      <LinkButton
                        colorScheme={secondaryButtonColorScheme}
                        variant="outline"
                        size="lg"
                        href={getReferenceLinkHref(
                          slide.secondaryButtonUrl,
                          site.siteMapArray,
                          site.assetsBaseUrl,
                        )}
                        isWithFocusVisibleHighlight
                      >
                        {slide.secondaryButtonLabel}
                      </LinkButton>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <CarouselControls
            className={isBlockStyle ? "mt-8 hidden lg:flex" : "hidden lg:flex"}
            slideCount={slides.length}
            currentIndex={currentIndex}
            onSelect={navigateToIndex}
            onPrev={() => navigateByDirection("prev")}
            onNext={() => navigateByDirection("next")}
            isDotsClickable={isBlockStyle}
            isPending={isPending}
          />
        </div>
        {!isBlockStyle && mobileControls}
      </div>

      {isBlockStyle && (
        <div
          className="relative h-80 overflow-hidden lg:h-auto lg:max-h-full lg:min-h-[31.25rem] lg:w-1/2"
          style={{ contain: "layout" }}
        >
          {images}
          {mobileControls}
        </div>
      )}
    </section>
  )
}
