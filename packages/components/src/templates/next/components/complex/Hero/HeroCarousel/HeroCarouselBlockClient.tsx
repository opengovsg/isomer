"use client"

import type { HeadingTag } from "~/utils/getHeadingTag"

import type { HeroCarouselSlideView } from "./CarouselSlides"
import { CarouselControls } from "./CarouselControls"
import {
  CarouselLiveRegion,
  CarouselSlideContent,
  CarouselSlideImages,
} from "./CarouselSlides"
import { useRotation } from "./hooks/useRotation"

export const HeroCarouselBlockClient = ({
  headingTag,
  assetsBaseUrl,
  slides,
}: {
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

  return (
    <section
      className="relative flex min-h-[15rem] flex-col sm:min-h-[22.5rem] lg:min-h-[31.25rem] lg:flex-row"
      aria-roledescription="carousel"
      aria-label="Hero carousel"
      {...sectionProps}
    >
      <CarouselControls
        {...controlProps}
        className="absolute inset-x-0 bottom-0 z-20 px-6 pb-6 pt-12 md:px-10 lg:hidden"
      />
      <div className="flex flex-col bg-brand-canvas-inverse px-6 pb-6 pt-11 md:px-10 lg:w-1/2 lg:justify-end lg:pb-12 lg:pl-10 lg:pr-8">
        <div className="flex w-full max-w-[548px] flex-col justify-center gap-9 text-base-content-inverse lg:mx-0 lg:ml-auto">
          <CarouselControls
            {...controlProps}
            className="order-2 mt-8 hidden lg:flex"
          />
          <CarouselSlideContent
            slides={slides}
            currentIndex={currentIndex}
            headingTag={headingTag}
            titleClassName="prose-display-xl wrap-break-word text-balance"
            actionsClassName="flex flex-col justify-start gap-x-5 gap-y-4 sm:flex-row"
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
