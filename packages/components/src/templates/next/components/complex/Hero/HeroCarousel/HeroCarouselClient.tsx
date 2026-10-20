"use client"

import type { HeroCarouselLayout } from "~/interfaces/complex/Hero"
import type { HeadingTag } from "~/utils/getHeadingTag"
import { useCallback, useState, useTransition } from "react"
import { HERO_CAROUSEL_LAYOUT } from "~/interfaces/complex/Hero"
import { tv } from "~/lib/tv"

import { ComponentContent } from "../../../internal/customCssClass"
import { ImageClient } from "../../../internal/ImageClient"
import { LinkButton } from "../../../internal/LinkButton/LinkButton"
import { CarouselControls } from "./CarouselControls"
import { useHeroCarouselPreview } from "./HeroCarouselPreviewContext"

const createHeroCarouselStyles = tv({
  slots: {
    section: "flex min-h-[15rem] sm:min-h-[22.5rem] lg:min-h-[31.25rem]",
    contentPanel: "flex flex-col",
    contentInner: "flex w-full flex-col gap-9",
    title: "prose-display-xl",
    controls: "",
    mobileControls:
      "absolute inset-x-0 bottom-0 z-20 px-6 pb-6 pt-12 md:px-10 lg:hidden",
    slideImage:
      "absolute inset-0 z-0 h-full w-full opacity-0 transition-opacity duration-150 ease-out motion-reduce:transition-none",
    slideContent:
      "col-start-1 row-start-1 flex flex-col gap-6 opacity-0 transition-opacity duration-150 ease-out motion-reduce:transition-none",
  },
  variants: {
    layout: {
      [HERO_CAROUSEL_LAYOUT.block]: {
        section: "flex-col lg:flex-row",
        contentPanel:
          "bg-brand-canvas-inverse px-6 pb-6 pt-11 md:px-10 lg:w-1/2 lg:justify-end lg:pb-12 lg:pl-10 lg:pr-8",
        contentInner:
          "max-w-[548px] justify-center text-base-content-inverse lg:mx-0 lg:ml-auto",
        title: "wrap-break-word text-balance",
        controls: "mt-8 hidden lg:flex",
      },
      [HERO_CAROUSEL_LAYOUT.gradient]: {
        section: "relative",
        contentPanel:
          "relative z-10 w-full justify-end bg-gradient-to-r from-[rgba(0,0,0,85%)] to-[rgba(0,0,0,10%)] xl:from-[rgba(0,0,0,100%)]",
        contentInner: `${ComponentContent} py-16 pb-10 text-start text-base-content-inverse lg:pb-[54px]`,
        title: "break-words",
        controls: "",
      },
    } satisfies Record<
      HeroCarouselLayout,
      {
        section: string
        contentPanel: string
        contentInner: string
        title: string
        controls: string
      }
    >,
    isCurrent: {
      true: {
        slideImage: "z-10 opacity-100",
        slideContent: "relative z-10 opacity-100",
      },
    },
    isHidden: {
      true: {
        slideContent: "pointer-events-none",
      },
    },
  },
})

const styles = createHeroCarouselStyles()

interface HeroCarouselSlideView {
  backgroundUrl: string
  title: string
  subtitle?: string
  primaryLabel?: string
  primaryHref?: string
  secondaryLabel?: string
  secondaryHref?: string
}

export const HeroCarouselClient = ({
  layout,
  headingTag: Tag,
  assetsBaseUrl,
  slides,
}: {
  layout: HeroCarouselLayout
  headingTag: HeadingTag
  assetsBaseUrl?: string
  slides: HeroCarouselSlideView[]
}) => {
  const preview = useHeroCarouselPreview()
  const [localIndex, setLocalIndex] = useState(0)
  const [, startTransition] = useTransition()

  const rawIndex = preview ? preview.activeIndex : localIndex
  // Clamp for this render only. Arrow clicks are what write a new index.
  const currentIndex =
    slides.length === 0 ? 0 : Math.min(Math.max(rawIndex, 0), slides.length - 1)

  const navigateByDirection = useCallback(
    (direction: "prev" | "next") => {
      if (slides.length === 0) {
        return
      }

      const offset = direction === "next" ? 1 : -1
      const next = (currentIndex + offset + slides.length) % slides.length
      startTransition(() => {
        if (preview) {
          preview.setActiveIndex(next)
        } else {
          setLocalIndex(next)
        }
      })
    },
    [currentIndex, preview, slides.length, startTransition],
  )

  const currentSlide = slides[currentIndex]

  const images = slides.map((slide, index) => {
    const isCurrent = index === currentIndex

    return (
      <div
        key={slide.backgroundUrl + index}
        className={styles.slideImage({ isCurrent })}
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

  const carouselControlProps = {
    slideCount: slides.length,
    currentIndex,
    onPrev: () => navigateByDirection("prev"),
    onNext: () => navigateByDirection("next"),
  }

  return (
    <section
      className={styles.section({ layout })}
      aria-roledescription="carousel"
      aria-label="Hero carousel"
    >
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {currentSlide
          ? `Slide ${currentIndex + 1} of ${slides.length}: ${currentSlide.title}`
          : ""}
      </p>
      {layout === HERO_CAROUSEL_LAYOUT.gradient && (
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ contain: "layout" }}
        >
          {images}
        </div>
      )}
      <div className={styles.contentPanel({ layout })}>
        <div className={styles.contentInner({ layout })}>
          <div className="grid">
            {slides.map((slide, index) => {
              const isCurrent = index === currentIndex

              return (
                <div
                  key={index}
                  className={styles.slideContent({
                    isCurrent,
                    isHidden: !isCurrent,
                  })}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${index + 1} of ${slides.length}`}
                  {...(isCurrent ? {} : { inert: "" })}
                >
                  <div className="flex flex-col gap-6">
                    <Tag className={styles.title({ layout })}>
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

          <div className="grid min-h-[3rem]">
            {slides.map((slide, index) => {
              const isCurrent = index === currentIndex

              if (!slide.primaryLabel || !slide.primaryHref) {
                return null
              }

              return (
                <div
                  key={index}
                  className={styles.slideContent({
                    isCurrent,
                    isHidden: !isCurrent,
                  })}
                  {...(isCurrent ? {} : { inert: "" })}
                >
                  <div className="flex flex-wrap gap-4">
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
                </div>
              )
            })}
          </div>

          <CarouselControls
            {...carouselControlProps}
            className={styles.controls({ layout })}
          />
        </div>
      </div>

      {layout === HERO_CAROUSEL_LAYOUT.block && (
        <div
          className="relative h-80 overflow-hidden lg:h-auto lg:max-h-full lg:min-h-[31.25rem] lg:w-1/2"
          style={{ contain: "layout" }}
        >
          {images}
          <CarouselControls
            {...carouselControlProps}
            className={styles.mobileControls()}
          />
        </div>
      )}
    </section>
  )
}
