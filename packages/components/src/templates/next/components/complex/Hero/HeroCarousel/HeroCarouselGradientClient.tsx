"use client"

import type { HeroCarouselContentAlignment } from "~/interfaces/complex/Hero"
import type { HeadingTag } from "~/utils/getHeadingTag"
import { HERO_CAROUSEL_CONTENT_ALIGNMENT } from "~/interfaces/complex/Hero"
import { tv } from "~/lib/tv"

import type { HeroCarouselSlideView } from "./CarouselSlides"
import { ComponentContent } from "../../../internal/customCssClass"
import {
  CarouselPauseControl,
  CarouselPositionControl,
} from "./CarouselControls"
import {
  CarouselLiveRegion,
  CarouselSlideContent,
  CarouselSlideImages,
} from "./CarouselSlides"
import { useRotation } from "./hooks/useRotation"

const gradientCarouselStyles = tv({
  slots: {
    section:
      "relative flex min-h-[15rem] [touch-action:pan-y_pinch-zoom] sm:min-h-[22.5rem] lg:min-h-[31.25rem]",
    contentPanel: "relative z-10 flex w-full flex-col justify-end",
    // Copy spans row 1; pause and slide position share row 2 (right column, left column).
    contentInner: `${ComponentContent} grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-9 py-16 pb-10 text-start text-base-content-inverse lg:pb-[54px]`,
    actions: "flex flex-col justify-start gap-x-5 gap-y-4 sm:flex-row",
  },
  variants: {
    // Mobile stays left-aligned; centered from md up with a fixed height
    contentAlignment: {
      [HERO_CAROUSEL_CONTENT_ALIGNMENT.left]: {
        contentPanel:
          "max-lg:bg-black/60 lg:bg-gradient-to-r lg:from-black lg:to-black/25",
      },
      [HERO_CAROUSEL_CONTENT_ALIGNMENT.center]: {
        section: "md:h-[40rem] md:min-h-0 lg:min-h-0",
        contentPanel: "bg-black/60",
        // !utilities override ComponentContent padding from a more specific ancestor.
        // From md, flex centres the copy. This box stays unpositioned so the
        // pause and slide position anchor to contentPanel, the full-bleed hero.
        contentInner:
          "md:!mx-auto md:flex md:w-full md:!max-w-[54.75rem] md:flex-1 md:flex-col md:justify-center md:self-center md:!px-10 md:py-16 md:text-center lg:pb-16",
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
  inactiveHeadingTag,
  assetsBaseUrl,
  slides,
}: {
  contentAlignment?: HeroCarouselContentAlignment
  headingTag: HeadingTag
  inactiveHeadingTag: HeadingTag
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
  const isCentered = contentAlignment === HERO_CAROUSEL_CONTENT_ALIGNMENT.center

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
          <CarouselPauseControl
            currentIndex={currentIndex}
            rotation={controlProps.rotation}
            isCenteredOnTablet={isCentered}
          />
          <div className="col-span-2 row-start-1 flex min-w-0 flex-col gap-9">
            <CarouselSlideContent
              slides={slides}
              currentIndex={currentIndex}
              headingTag={headingTag}
              inactiveHeadingTag={inactiveHeadingTag}
              titleClassName="prose-display-xl break-words"
              actionsClassName={styles.actions()}
              isVerticallyCenteredPerSlide={isCentered}
            />
          </div>
          <CarouselPositionControl
            slideCount={controlProps.slideCount}
            currentIndex={currentIndex}
            onPrev={controlProps.onPrev}
            onNext={controlProps.onNext}
            isCenteredOnTablet={isCentered}
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
