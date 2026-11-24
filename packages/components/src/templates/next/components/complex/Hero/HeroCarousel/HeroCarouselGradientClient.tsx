"use client"

import type { HeadingTag } from "~/utils/getHeadingTag"
import {
  HERO_CAROUSEL_CONTENT_ALIGNMENT,
  type HeroCarouselContentAlignment,
} from "~/interfaces/complex/Hero/constants"
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
    contentInner: `${ComponentContent} grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-16 py-16 pb-9 text-start text-base-content-inverse lg:pb-16`,
    copy: "col-span-2 row-start-1 flex min-w-0 flex-col",
    actions: "flex flex-wrap justify-start gap-x-5 gap-y-4 [&>*]:h-auto",
  },
  variants: {
    contentAlignment: {
      [HERO_CAROUSEL_CONTENT_ALIGNMENT.left]: {
        contentPanel:
          "max-lg:bg-black/60 lg:bg-gradient-to-r lg:from-black lg:to-black/25",
      },
      [HERO_CAROUSEL_CONTENT_ALIGNMENT.center]: {
        // Clears the section min-height so the hero matches its content.
        section: "md:min-h-0 lg:min-h-0",
        contentPanel: "bg-black/60 md:justify-start",
        // The ! prefix overrides ComponentContent padding from an ancestor.
        contentInner:
          "md:!mx-0 md:grid md:w-full md:!max-w-none md:grid-cols-1 md:gap-y-0 md:!px-0 md:pb-9 md:pt-0 lg:pb-16",
        copy: "md:col-span-1 md:!mx-auto md:w-full md:!max-w-[54.75rem] md:!px-10 md:py-16 md:text-center lg:mt-16",
        actions: "md:justify-center",
      },
    } satisfies Record<
      HeroCarouselContentAlignment,
      Partial<
        Record<
          "section" | "contentPanel" | "contentInner" | "copy" | "actions",
          string
        >
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
          <div className={styles.copy()}>
            <CarouselSlideContent
              slides={slides}
              currentIndex={currentIndex}
              headingTag={headingTag}
              inactiveHeadingTag={inactiveHeadingTag}
              titleClassName="prose-display-xl break-words text-[2.25rem] leading-[1.2] md:text-[3rem] md:leading-[1.1] xl:text-[3rem] xl:leading-[1.1]"
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
