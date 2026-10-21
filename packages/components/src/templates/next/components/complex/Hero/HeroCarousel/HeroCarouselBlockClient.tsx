"use client"

import type { HeadingTag } from "~/utils/getHeadingTag"

import type { HeroCarouselSlideView } from "./CarouselSlides"
import { CarouselControls } from "./CarouselControls"
import {
  CarouselLiveRegion,
  CarouselSlideContent,
  CarouselSlideImages,
} from "./CarouselSlides"
import { useHeroCarouselNavigation } from "./useHeroCarouselNavigation"

export const HeroCarouselBlockClient = ({
  headingTag,
  assetsBaseUrl,
  slides,
}: {
  headingTag: HeadingTag
  assetsBaseUrl?: string
  slides: HeroCarouselSlideView[]
}) => {
  const { currentIndex, controlProps } = useHeroCarouselNavigation(
    slides.length,
  )

  return (
    <section
      className="flex min-h-[15rem] flex-col sm:min-h-[22.5rem] lg:min-h-[31.25rem] lg:flex-row"
      aria-roledescription="carousel"
      aria-label="Hero carousel"
    >
      <CarouselLiveRegion slides={slides} currentIndex={currentIndex} />
      <div className="flex flex-col bg-brand-canvas-inverse px-6 pb-6 pt-11 md:px-10 lg:w-1/2 lg:justify-end lg:pb-12 lg:pl-10 lg:pr-8">
        <div className="flex w-full max-w-[548px] flex-col justify-center gap-9 text-base-content-inverse lg:mx-0 lg:ml-auto">
          <CarouselSlideContent
            slides={slides}
            currentIndex={currentIndex}
            headingTag={headingTag}
            titleClassName="prose-display-xl wrap-break-word text-balance"
            actionsClassName="flex flex-col justify-start gap-x-5 gap-y-4 sm:flex-row"
          />
          <CarouselControls {...controlProps} className="mt-8 hidden lg:flex" />
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
        <CarouselControls
          {...controlProps}
          className="absolute inset-x-0 bottom-0 z-20 px-6 pb-6 pt-12 md:px-10 lg:hidden"
        />
      </div>
    </section>
  )
}
