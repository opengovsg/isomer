"use client"

import type { HeroCarouselProps } from "~/interfaces/complex/Hero"
import { useCallback, useState, useTransition } from "react"
import { HERO_CAROUSEL_STYLE } from "~/interfaces/complex/Hero"
import { tv } from "~/lib/tv"
import { getHeadingTag } from "~/utils/getHeadingTag"
import { getReferenceLinkHref } from "~/utils/getReferenceLinkHref"

import { ComponentContent } from "../../../internal/customCssClass"
import { ImageClient } from "../../../internal/ImageClient"
import { LinkButton } from "../../../internal/LinkButton/LinkButton"
import { CarouselControls } from "./CarouselControls"

const sectionStyles = tv({
  base: "flex min-h-[15rem] sm:min-h-[22.5rem] lg:min-h-[31.25rem]",
  variants: {
    isBlock: {
      true: "flex-col lg:flex-row",
      false: "relative",
    },
  },
})

const contentPanelStyles = tv({
  variants: {
    isBlock: {
      true: "flex flex-col bg-brand-canvas-inverse px-6 pb-6 pt-11 md:px-10 lg:w-1/2 lg:justify-end lg:pb-12 lg:pl-10 lg:pr-8",
      false:
        "relative z-10 flex w-full flex-col justify-end bg-gradient-to-r from-[rgba(0,0,0,85%)] to-[rgba(0,0,0,10%)] xl:from-[rgba(0,0,0,100%)]",
    },
  },
})

const contentInnerStyles = tv({
  base: "flex w-full flex-col gap-9",
  variants: {
    isBlock: {
      true: "max-w-[548px] justify-center text-base-content-inverse lg:mx-0 lg:ml-auto",
      false: `${ComponentContent} py-16 text-start text-base-content-inverse`,
    },
  },
})

const titleStyles = tv({
  base: "prose-display-xl",
  variants: {
    isBlock: {
      true: "wrap-break-word text-balance",
      false: "break-words",
    },
  },
})

const mobileControlsStyles = tv({
  base: "absolute inset-x-0 bottom-0 z-20 px-6 pb-10 pt-12 md:px-10 lg:hidden",
  variants: {
    isBlock: {
      false: "bg-gradient-to-t from-black/50 to-transparent",
    },
  },
})

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

export const HeroCarouselClient = ({
  slides,
  style = HERO_CAROUSEL_STYLE.block,
  site,
  headingLevel,
}: HeroCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPending, startTransition] = useTransition()

  const Tag = getHeadingTag(headingLevel)
  const isBlock = style === HERO_CAROUSEL_STYLE.block

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
    <div className={mobileControlsStyles({ isBlock })}>
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
      className={sectionStyles({ isBlock })}
      aria-roledescription="carousel"
      aria-label="Hero carousel"
    >
      {!isBlock && (
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ contain: "layout" }}
        >
          {images}
        </div>
      )}
      <div className={contentPanelStyles({ isBlock })}>
        <div className={contentInnerStyles({ isBlock })}>
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
                    <Tag className={titleStyles({ isBlock })}>
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
                      colorScheme={isBlock ? "inverse" : undefined}
                      isWithFocusVisibleHighlight
                    >
                      {slidePrimaryButtonLabel}
                    </LinkButton>
                    {slide.secondaryButtonLabel && slide.secondaryButtonUrl && (
                      <LinkButton
                        colorScheme="inverse"
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
            slideCount={slides.length}
            currentIndex={currentIndex}
            onSelect={navigateToIndex}
            onPrev={() => navigateByDirection("prev")}
            onNext={() => navigateByDirection("next")}
            isDotsClickable
            isPending={isPending}
            isDesktopOnly
            hasTopMargin={isBlock}
          />
        </div>
        {!isBlock && mobileControls}
      </div>

      {isBlock && (
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
