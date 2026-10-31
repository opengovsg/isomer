"use client"

import type { HeadingTag } from "~/utils/getHeadingTag"
import {
  HERO_BLOCK_IMAGE_POSITION,
  type HeroCarouselImagePosition,
} from "~/interfaces/complex/Hero"
import { tv } from "~/lib/tv"

import type { HeroCarouselSlideView } from "./CarouselSlides"
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

const blockCarouselStyles = tv({
  slots: {
    section:
      "relative flex min-h-[15rem] flex-col [touch-action:pan-y_pinch-zoom] sm:min-h-[22.5rem] lg:min-h-[31.25rem]",
    mobilePause: "absolute right-6 z-20 md:right-10 lg:hidden",
    textColumn:
      "flex flex-col bg-brand-canvas-inverse px-6 pb-6 pt-11 md:px-10 lg:w-1/2 lg:justify-end lg:pb-12",
    content:
      "grid w-full max-w-[548px] grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-9 text-base-content-inverse lg:mx-0",
    actions: "flex flex-col justify-start gap-x-5 gap-y-4 sm:flex-row",
    imageColumn:
      "relative h-80 overflow-hidden lg:h-auto lg:max-h-full lg:min-h-[31.25rem] lg:w-1/2",
    mobileDots:
      "absolute left-6 z-20 flex h-10 items-center md:left-10 lg:hidden [@media(pointer:coarse)]:h-11",
    contentPause: "",
    contentPosition: "mt-8",
  },
  variants: {
    imagePosition: {
      [HERO_BLOCK_IMAGE_POSITION.right]: {
        section: "lg:flex-row",
        mobilePause: "bottom-6",
        textColumn: "lg:pl-10 lg:pr-8",
        content: "lg:ml-auto",
        mobileDots: "bottom-6",
        // Below lg these controls overlay the image, so this copy stays hidden.
        contentPause: "mt-8 hidden lg:inline-flex",
        contentPosition: "hidden lg:flex",
      },
      [HERO_BLOCK_IMAGE_POSITION.left]: {
        section: "max-lg:flex-col-reverse lg:flex-row-reverse",
        // Image is above the copy below lg, so the controls stay in the text block.
        mobilePause: "hidden",
        // Anchor the pause to this column below lg, not the 548px copy grid.
        textColumn: "max-lg:relative lg:pl-16 lg:pr-10",
        mobileDots: "hidden",
        contentPause:
          "max-lg:absolute max-lg:bottom-6 max-lg:right-6 max-lg:z-20 md:max-lg:right-10 lg:mt-8",
        contentPosition: "flex",
      },
    } satisfies Record<
      HeroCarouselImagePosition,
      {
        section: string
        mobilePause: string
        textColumn: string
        mobileDots: string
        content?: string
        contentPause: string
        contentPosition: string
      }
    >,
  },
})

export const HeroCarouselBlockClient = ({
  imagePosition,
  headingTag,
  inactiveHeadingTag,
  assetsBaseUrl,
  slides,
}: {
  imagePosition: HeroCarouselImagePosition
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
  const styles = blockCarouselStyles({ imagePosition })

  return (
    <section
      className={styles.section()}
      aria-roledescription="carousel"
      aria-label="Hero carousel"
      {...sectionProps}
    >
      {/* Image-right below lg: pause overlays the image. First in the DOM, so it is the first tab stop. */}
      <CarouselPauseControl
        currentIndex={currentIndex}
        rotation={controlProps.rotation}
        className={styles.mobilePause()}
      />
      <div className={styles.textColumn()}>
        {/* Copy on row 1. Slide position sits left and pause right on row 2. */}
        <div className={styles.content()}>
          <CarouselPauseControl
            currentIndex={currentIndex}
            rotation={controlProps.rotation}
            className={styles.contentPause()}
          />
          <div className="col-span-2 row-start-1 flex min-w-0 flex-col gap-9">
            <CarouselSlideContent
              slides={slides}
              currentIndex={currentIndex}
              headingTag={headingTag}
              inactiveHeadingTag={inactiveHeadingTag}
              titleClassName="prose-display-xl wrap-break-word text-balance"
              actionsClassName={styles.actions()}
            />
          </div>
          <CarouselPositionControl
            slideCount={controlProps.slideCount}
            currentIndex={currentIndex}
            onPrev={controlProps.onPrev}
            onNext={controlProps.onNext}
            className={styles.contentPosition()}
            hasBackdrop={false}
          />
        </div>
      </div>

      <div className={styles.imageColumn()} style={{ contain: "layout" }}>
        <CarouselSlideImages
          slides={slides}
          currentIndex={currentIndex}
          assetsBaseUrl={assetsBaseUrl}
        />
      </div>
      {/* Image-right below lg: the position chip overlays the image. h-10 centres it on the pause. */}
      <div className={styles.mobileDots()}>
        <CarouselPositionControl
          slideCount={controlProps.slideCount}
          currentIndex={currentIndex}
          onPrev={controlProps.onPrev}
          onNext={controlProps.onNext}
        />
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
