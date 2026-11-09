"use client"

import type { CSSProperties, ReactNode } from "react"
import type { VariantProps } from "tailwind-variants"
import { Children } from "react"
import { BiChevronLeft, BiChevronRight } from "react-icons/bi"
import { INFOCARD_VARIANT } from "~/interfaces/complex/InfoCards"
import { tv } from "~/lib/tv"

import {
  CARDS_PER_PAGE_CSS_VAR,
  SLIDE_DATA_ATTRIBUTE,
  TRACK_DATA_ATTRIBUTE,
} from "./constants"
import { NavigationButton } from "./NavigationButton"
import { NavigationDots } from "./NavigationDots"
import { useNavigation } from "./useNavigation"

// Written in full so Tailwind extracts every utility. The custom property name
// has to match what `useNavigation` reads back.
const viewportClass =
  "relative overflow-hidden [--card-width:calc((100cqi-var(--sliver)-(var(--cards-per-page)-1)*var(--gap))/var(--cards-per-page))] [--cards-per-page:1] [--has-next:min(1,max(0,var(--card-count)-var(--cards-per-page)))] [--sliver:calc((var(--gap)+5rem)*var(--has-next))] [container-type:inline-size] md:[--cards-per-page:2] lg:[--cards-per-page:3] lg:[--sliver:calc(8.75rem*var(--has-next))]"

if (!viewportClass.includes(CARDS_PER_PAGE_CSS_VAR)) {
  throw new Error(
    `Carousel viewport classes must set ${CARDS_PER_PAGE_CSS_VAR}`,
  )
}

const carouselStyles = tv({
  slots: {
    // The next card starts after the gap, so the sliver is that gap plus the
    // visible slice. Below lg the slice is 5rem, wider than the fade, or the
    // gradient covers the card. From lg the sliver is the 8.75rem (140px) edge
    // fade. The fade itself is only the outer edge: 24px, 40px from md, 140px
    // from lg. `--has-next` is 0 when every card already fits, so that sliver
    // is not reserved.
    viewport: viewportClass,
    track:
      "ease flex gap-[var(--gap)] transition-transform duration-300 motion-reduce:transition-none",
    slide: "flex w-[var(--card-width)] shrink-0 flex-col",
    fade: "pointer-events-none absolute inset-y-0 z-10 w-6 md:w-10 lg:w-[8.75rem]",
  },
  variants: {
    variant: {
      [INFOCARD_VARIANT.default]: {
        viewport: "[--gap:2rem]",
      },
      [INFOCARD_VARIANT.bold]: {
        viewport: "[--gap:0.25rem]",
      },
      [INFOCARD_VARIANT.block]: {
        viewport: "[--gap:1.75rem]",
      },
    },
    fadeSide: {
      right: {
        fade: "right-0 bg-gradient-to-l from-base-canvas to-transparent",
      },
      left: {
        fade: "left-0 bg-gradient-to-r from-base-canvas to-transparent",
      },
    },
  },
  defaultVariants: {
    variant: INFOCARD_VARIANT.default,
  },
})

const carousel = carouselStyles()

interface CarouselWrapperClientProps {
  cardCount: number
  variant: NonNullable<VariantProps<typeof carouselStyles>["variant"]>
  children: ReactNode
}

export const CarouselWrapperClient = ({
  cardCount,
  variant,
  children,
}: CarouselWrapperClientProps) => {
  const {
    viewportRef,
    previousButtonRef,
    nextButtonRef,
    offset,
    pageIndex,
    pages,
    cardsPerPage,
    showControls,
    isLastPage,
    pageStart,
    announcement,
    goToPage,
  } = useNavigation({ cardCount })

  const fadeSide = isLastPage ? "left" : "right"

  return (
    <div>
      <div
        ref={viewportRef}
        className={carousel.viewport({ variant })}
        style={{ "--card-count": cardCount } as CSSProperties}
      >
        <div
          {...{ [TRACK_DATA_ATTRIBUTE]: true }}
          className={carousel.track()}
          style={{ transform: `translateX(-${offset}px)` }}
        >
          {Children.toArray(children).map((slide, index) => {
            const interactive =
              !showControls ||
              (index >= pageStart && index < pageStart + cardsPerPage)
            return (
              <div
                key={index}
                ref={(node) => {
                  if (!node) return
                  if (interactive) node.removeAttribute("inert")
                  else node.setAttribute("inert", "")
                }}
                {...{ [SLIDE_DATA_ATTRIBUTE]: true }}
                data-slide-index={index}
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${cardCount}`}
                aria-hidden={interactive ? undefined : true}
                className={carousel.slide()}
              >
                {slide}
              </div>
            )
          })}
        </div>
        {showControls && (
          <div
            aria-hidden
            data-fade-side={fadeSide}
            className={carousel.fade({ fadeSide })}
          />
        )}
      </div>

      <div aria-live="polite" role="status" className="sr-only">
        {announcement}
      </div>

      {showControls && (
        <div className="mt-8 flex items-center justify-between gap-4">
          <NavigationDots
            pages={pages}
            pageIndex={pageIndex}
            goToPage={goToPage}
          />
          <div className="flex items-center gap-2">
            <NavigationButton
              ref={previousButtonRef}
              aria-label="Previous page"
              disabled={pageIndex === 0}
              onClick={() => goToPage(pageIndex - 1)}
              Icon={BiChevronLeft}
            />
            <NavigationButton
              ref={nextButtonRef}
              aria-label="Next page"
              disabled={isLastPage}
              onClick={() => goToPage(pageIndex + 1)}
              Icon={BiChevronRight}
            />
          </div>
        </div>
      )}
    </div>
  )
}
