"use client"

import type { HeroCarouselContentAlignment } from "~/interfaces/complex/Hero"
import type { HeadingTag } from "~/utils/getHeadingTag"
import { HERO_CAROUSEL_CONTENT_ALIGNMENT } from "~/interfaces/complex/Hero"
import { tv } from "~/lib/tv"

import type { HeroCarouselSlideView } from "./CarouselSlides"
import { ComponentContent } from "../../../internal/customCssClass"
import { CarouselControls } from "./CarouselControls"
import {
  CarouselLiveRegion,
  CarouselSlideContent,
  CarouselSlideImages,
} from "./CarouselSlides"
import { useRotation } from "./hooks/useRotation"

const gradientCarouselStyles = tv({
  slots: {
    section:
      "relative flex min-h-[15rem] sm:min-h-[22.5rem] lg:min-h-[31.25rem]",
    contentPanel:
      "relative z-10 flex w-full flex-col justify-end bg-gradient-to-r from-[rgba(0,0,0,85%)] to-[rgba(0,0,0,10%)] xl:from-[rgba(0,0,0,100%)]",
    contentInner: `${ComponentContent} flex flex-col gap-9 py-16 pb-10 text-start text-base-content-inverse lg:pb-[54px]`,
    actions: "flex flex-col justify-start gap-x-5 gap-y-4 sm:flex-row",
  },
  variants: {
    // Mobile stays left-aligned; centered from md up with a fixed height
    contentAlignment: {
      [HERO_CAROUSEL_CONTENT_ALIGNMENT.left]: {},
      [HERO_CAROUSEL_CONTENT_ALIGNMENT.center]: {
        section: "md:h-[40rem] md:min-h-0 lg:min-h-0",
        // Flat 60% black overlay instead of the left-to-right gradient
        contentPanel: "md:justify-center md:bg-black/60 md:bg-none",
        // Tablet: clear the arrows (3.5rem offset + 2.5rem button) by 44px.
        // The !utilities override ComponentContent's padding and max width,
        // which an ancestor sets with a more specific selector.
        contentInner:
          "md:!px-[8.75rem] md:py-16 md:text-center lg:!mx-auto lg:w-full lg:!max-w-[54.75rem] lg:!px-10 lg:pb-16",
        actions: "md:justify-center",
      },
    } satisfies Record<
      HeroCarouselContentAlignment,
      Partial<
        Record<"section" | "contentPanel" | "contentInner" | "actions", string>
      >
    >,
  },
})

export const HeroCarouselGradientClient = ({
  contentAlignment = HERO_CAROUSEL_CONTENT_ALIGNMENT.left,
  headingTag,
  assetsBaseUrl,
  slides,
}: {
  contentAlignment?: HeroCarouselContentAlignment
  headingTag: HeadingTag
  assetsBaseUrl?: string
  slides: HeroCarouselSlideView[]
}) => {
  const {
    currentIndex,
    controlProps,
    showLiveRegion,
    politeness,
    sectionProps,
  } = useRotation(slides.length)
  const styles = gradientCarouselStyles({ contentAlignment })

  return (
    <section
      className={styles.section()}
      aria-roledescription="carousel"
      aria-label="Hero carousel"
      {...sectionProps}
    >
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ contain: "layout" }}
      >
        <CarouselSlideImages
          slides={slides}
          currentIndex={currentIndex}
          assetsBaseUrl={assetsBaseUrl}
        />
      </div>
      <div className={styles.contentPanel()}>
        <div className={styles.contentInner()}>
          <CarouselControls
            {...controlProps}
            className="order-2"
            isCenteredOnTablet={
              contentAlignment === HERO_CAROUSEL_CONTENT_ALIGNMENT.center
            }
          />
          <CarouselSlideContent
            slides={slides}
            currentIndex={currentIndex}
            headingTag={headingTag}
            titleClassName="prose-display-xl break-words"
            actionsClassName={styles.actions()}
            isVerticallyCenteredPerSlide={
              contentAlignment === HERO_CAROUSEL_CONTENT_ALIGNMENT.center
            }
          />
        </div>
      </div>
      {showLiveRegion && (
        <CarouselLiveRegion
          slides={slides}
          currentIndex={currentIndex}
          politeness={politeness}
        />
      )}
    </section>
  )
}
