"use client"

import type { CSSProperties, ReactNode } from "react"
import type { VariantProps } from "tailwind-variants"
import { Children } from "react"
import { BiChevronLeft, BiChevronRight } from "react-icons/bi"
import { tv } from "~/lib/tv"

import { useInfoCardsCarouselNavigation } from "./useInfoCardsCarouselNavigation"

const carouselStyles = tv({
  slots: {
    // The next card starts after the gap, so the reserved sliver includes that
    // gap. On mobile the gap is wider than 10% of the viewport, which hid the
    // next card. 5rem is the visible slice. The fade is the outer edge of that slice.
    // `--has-next` is 0 when every card already fits, so that sliver is not reserved.
    viewport:
      "relative overflow-hidden [--card-width:calc((100cqi-var(--sliver)-(var(--cards-per-page)-1)*var(--gap))/var(--cards-per-page))] [--cards-per-page:1] [--has-next:min(1,max(0,var(--card-count)-var(--cards-per-page)))] [--sliver:calc((var(--gap)+5rem)*var(--has-next))] [container-type:inline-size] md:[--cards-per-page:2] md:[--sliver:calc(10%*var(--has-next))] lg:[--cards-per-page:3]",
    track:
      "ease flex gap-[var(--gap)] transition-transform duration-300 motion-reduce:transition-none",
    slide: "w-[var(--card-width)] shrink-0",
    fade: "pointer-events-none absolute inset-y-0 z-10 w-6 md:w-[var(--sliver)]",
  },
  variants: {
    variant: {
      default: {
        viewport: "[--gap:2.5rem] md:[--gap:1.75rem] lg:[--gap:4rem]",
      },
      bold: {
        viewport: "[--gap:0.25rem]",
      },
    },
    fadeSide: {
      right: {
        fade: "right-0 bg-gradient-to-l from-base-canvas to-transparent",
      },
      left: {
        fade: "left-0 bg-gradient-to-r from-base-canvas to-transparent",
      },
      none: {
        fade: "hidden",
      },
    },
  },
  defaultVariants: {
    variant: "default",
    fadeSide: "none",
  },
})

const dotStyles = tv({
  slots: {
    group: "flex items-center",
    // Same padding on every control, so the gap beside the pill matches the
    // gap between dots. Mobile keeps 12px. Fine pointers from md use 8px,
    // which still makes a 24px target (WCAG 2.5.8).
    button:
      "flex h-6 shrink-0 items-center px-3 focus-visible:bg-utility-highlight focus-visible:shadow-focus-visible focus-visible:outline-0 [@media(pointer:coarse)]:h-11 [@media(pointer:fine)_and_(min-width:768px)]:px-2",
    dot: "block h-2 w-2 rounded-full bg-base-content-subtle transition-[width,background-color] duration-300 ease-out motion-reduce:transition-none",
  },
  variants: {
    isActive: {
      true: {
        dot: "w-6 bg-base-content-strong",
      },
    },
  },
  defaultVariants: {
    isActive: false,
  },
})

const arrowStyles = tv({
  slots: {
    group: "flex items-center gap-2",
    button:
      "flex size-10 items-center justify-center rounded-full border border-base-content-strong bg-base-canvas text-base-content-strong focus-visible:bg-utility-highlight focus-visible:text-base-content-strong focus-visible:outline-0 disabled:cursor-not-allowed disabled:border-base-divider-medium disabled:text-base-content-subtle [@media(pointer:coarse)]:size-11",
  },
})

const carousel = carouselStyles()
const dots = dotStyles()
const arrows = arrowStyles()

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
  } = useInfoCardsCarouselNavigation(cardCount)

  const slides = Children.toArray(children)

  return (
    <div>
      <div
        ref={viewportRef}
        className={carousel.viewport({ variant })}
        style={{ "--card-count": cardCount } as CSSProperties}
      >
        <div
          data-track
          className={carousel.track()}
          style={{ transform: `translateX(-${offset}px)` }}
        >
          {slides.map((slide, index) => {
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
                data-slide
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
        <div
          aria-hidden
          data-fade-side={
            showControls ? (isLastPage ? "left" : "right") : "none"
          }
          className={carousel.fade({
            fadeSide: showControls ? (isLastPage ? "left" : "right") : "none",
          })}
        />
      </div>

      <div aria-live="polite" role="status" className="sr-only">
        {announcement}
      </div>

      {showControls && (
        <div className="mt-6 flex items-center justify-between gap-4">
          <div className={dots.group()}>
            {Array.from({ length: pages }, (_, index) => {
              const isActive = index === pageIndex
              return (
                <button
                  key={index}
                  type="button"
                  aria-label={`Go to page ${index + 1} of ${pages}`}
                  aria-current={isActive ? "true" : undefined}
                  className={dots.button()}
                  onClick={() => goToPage(index)}
                >
                  <span className={dots.dot({ isActive })} />
                </button>
              )
            })}
          </div>
          <div className={arrows.group()}>
            <button
              ref={previousButtonRef}
              type="button"
              aria-label="Previous page"
              className={arrows.button()}
              disabled={pageIndex === 0}
              onClick={() => goToPage(pageIndex - 1)}
            >
              <BiChevronLeft aria-hidden className="size-6" />
            </button>
            <button
              ref={nextButtonRef}
              type="button"
              aria-label="Next page"
              className={arrows.button()}
              disabled={isLastPage}
              onClick={() => goToPage(pageIndex + 1)}
            >
              <BiChevronRight aria-hidden className="size-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
