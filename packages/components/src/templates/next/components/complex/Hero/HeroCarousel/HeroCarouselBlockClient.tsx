"use client"

import type { HeadingTag } from "~/utils/getHeadingTag"

import type { HeroCarouselSlideView } from "./CarouselSlides"
import { CarouselDotsControl, CarouselPauseControl } from "./CarouselControls"
import {
  CarouselLiveRegion,
  CarouselSlideContent,
  CarouselSlideImages,
} from "./CarouselSlides"
import { useRotation } from "./hooks/useRotation"

export const HeroCarouselBlockClient = ({
  headingTag,
  inactiveHeadingTag,
  assetsBaseUrl,
  slides,
}: {
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

  return (
    <section
      className="relative flex min-h-[15rem] flex-col [touch-action:pan-y_pinch-zoom] sm:min-h-[22.5rem] lg:min-h-[31.25rem] lg:flex-row"
      aria-roledescription="carousel"
      aria-label="Hero carousel"
      {...sectionProps}
    >
      {/* Below lg, pause overlays the image. First in the DOM, so it is the first tab stop. */}
      <CarouselPauseControl
        currentIndex={currentIndex}
        rotation={controlProps.rotation}
        className="absolute bottom-6 right-6 z-20 md:right-10 lg:hidden"
      />
      <div className="flex flex-col bg-brand-canvas-inverse px-6 pb-6 pt-11 md:px-10 lg:w-1/2 lg:justify-end lg:pb-12 lg:pl-10 lg:pr-8">
        {/* Desktop: copy on row 1, dots left and pause right on row 2. */}
        <div className="grid w-full max-w-[548px] grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-9 text-base-content-inverse lg:mx-0 lg:ml-auto">
          <CarouselPauseControl
            currentIndex={currentIndex}
            rotation={controlProps.rotation}
            className="mt-8 hidden lg:inline-flex"
          />
          <div className="col-span-2 row-start-1 flex min-w-0 flex-col gap-9">
            <CarouselSlideContent
              slides={slides}
              currentIndex={currentIndex}
              headingTag={headingTag}
              inactiveHeadingTag={inactiveHeadingTag}
              titleClassName="prose-display-xl wrap-break-word text-balance"
              actionsClassName="flex flex-col justify-start gap-x-5 gap-y-4 sm:flex-row"
            />
          </div>
          <CarouselDotsControl
            slideCount={controlProps.slideCount}
            currentIndex={currentIndex}
            onGoTo={controlProps.onGoTo}
            className="mt-8 hidden lg:flex"
          />
        </div>
      </div>

      <div
        className="relative h-80 overflow-hidden lg:h-auto lg:max-h-full lg:min-h-[31.25rem] lg:w-1/2"
        style={{ contain: "layout" }}
      >
        <CarouselSlideImages
          slides={slides}
          currentIndex={currentIndex}
          assetsBaseUrl={assetsBaseUrl}
        />
      </div>
      {/* Below lg, dots overlay the image after the call to action. h-10 centres them on the pause. */}
      <div className="absolute bottom-6 left-6 z-20 flex h-10 items-center md:left-10 lg:hidden [@media(pointer:coarse)]:h-11">
        <CarouselDotsControl
          slideCount={controlProps.slideCount}
          currentIndex={currentIndex}
          onGoTo={controlProps.onGoTo}
          onPhoto
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
