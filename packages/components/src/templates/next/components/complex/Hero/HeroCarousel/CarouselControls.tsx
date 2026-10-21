import { BiChevronLeft, BiChevronRight } from "react-icons/bi"
import { tv } from "~/lib/tv"
import { twMerge } from "~/lib/twMerge"

const carouselDotStyles = tv({
  base: "h-2 shrink-0 rounded-full transition-[width,background-color] duration-150 ease-out motion-reduce:transition-none",
  variants: {
    isActive: {
      true: "w-6 bg-white",
      false: "w-2 bg-white/50",
    },
  },
})

const carouselControlsStyles = tv({
  slots: {
    root: "flex w-full items-center justify-between gap-4",
    dots: "flex items-center gap-2",
    arrows: "flex items-center gap-2",
    prev: "",
    next: "",
  },
  variants: {
    // From md up: dots sit bottom-centre and arrows at the vertical middle of
    // the nearest positioned ancestor's edges
    isCenteredOnTablet: {
      true: {
        root: "md:pointer-events-none md:absolute md:inset-0",
        dots: "md:absolute md:bottom-9 md:left-1/2 md:-translate-x-1/2 lg:bottom-10",
        arrows: "md:contents",
        prev: "md:pointer-events-auto md:absolute md:left-14 md:top-1/2 md:-translate-y-1/2 lg:left-16",
        next: "md:pointer-events-auto md:absolute md:right-14 md:top-1/2 md:-translate-y-1/2 lg:right-16",
      },
    },
  },
})

const CarouselArrowButton = ({
  direction,
  onClick,
  className,
}: {
  direction: "prev" | "next"
  onClick: () => void
  className?: string
}) => {
  const Icon = direction === "prev" ? BiChevronLeft : BiChevronRight
  const label = direction === "prev" ? "Previous slide" : "Next slide"

  return (
    <button
      type="button"
      className={twMerge(
        "flex h-10 w-10 items-center justify-center rounded-full border border-transparent bg-white text-base-content shadow-sm hover:bg-white/90 focus-visible:outline focus-visible:outline-[0.25rem] focus-visible:outline-offset-[0.125rem] focus-visible:outline-utility-highlight",
        className,
      )}
      aria-label={label}
      onClick={onClick}
    >
      <Icon className="h-6 w-6" aria-hidden />
    </button>
  )
}

const CarouselDots = ({
  count,
  currentIndex,
  className,
}: {
  count: number
  currentIndex: number
  className?: string
}) => (
  <div className={className} aria-hidden>
    {Array.from({ length: count }, (_, index) => (
      <span
        key={index}
        className={carouselDotStyles({ isActive: index === currentIndex })}
      />
    ))}
  </div>
)

export const CarouselControls = ({
  slideCount,
  currentIndex,
  onPrev,
  onNext,
  className,
  isCenteredOnTablet,
}: {
  slideCount: number
  currentIndex: number
  onPrev: () => void
  onNext: () => void
  className?: string
  isCenteredOnTablet?: boolean
}) => {
  const styles = carouselControlsStyles({ isCenteredOnTablet })

  return (
    <div className={styles.root({ className })}>
      <CarouselDots
        count={slideCount}
        currentIndex={currentIndex}
        className={styles.dots()}
      />
      <div className={styles.arrows()}>
        <CarouselArrowButton
          direction="prev"
          onClick={onPrev}
          className={styles.prev()}
        />
        <CarouselArrowButton
          direction="next"
          onClick={onNext}
          className={styles.next()}
        />
      </div>
    </div>
  )
}
