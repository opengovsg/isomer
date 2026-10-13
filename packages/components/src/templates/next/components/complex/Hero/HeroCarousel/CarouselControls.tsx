import { BiChevronLeft, BiChevronRight } from "react-icons/bi"
import { tv } from "~/lib/tv"

const carouselControlsStyles = tv({
  base: "flex w-full items-center justify-between gap-4",
  variants: {
    isDesktopOnly: {
      true: "hidden lg:flex",
    },
    hasTopMargin: {
      true: "mt-8",
    },
  },
})

const carouselDotStyles = tv({
  base: "h-2 shrink-0 rounded-full transition-[width,background-color] duration-150 ease-out motion-reduce:transition-none",
  variants: {
    isActive: {
      true: "w-6 bg-white",
      false: "w-2 bg-white/50 hover:bg-white/70 focus-visible:bg-white/70",
    },
  },
})

const CarouselArrowButton = ({
  direction,
  onClick,
  isDisabled,
}: {
  direction: "prev" | "next"
  onClick: () => void
  isDisabled?: boolean
}) => {
  const Icon = direction === "prev" ? BiChevronLeft : BiChevronRight
  const label = direction === "prev" ? "Previous slide" : "Next slide"

  return (
    <button
      type="button"
      className="flex h-10 w-10 items-center justify-center rounded-full border border-transparent bg-white text-base-content shadow-sm hover:bg-white/90 focus-visible:outline focus-visible:outline-[0.25rem] focus-visible:outline-offset-[0.125rem] focus-visible:outline-utility-highlight disabled:cursor-not-allowed disabled:opacity-50"
      aria-label={label}
      disabled={isDisabled}
      onClick={onClick}
    >
      <Icon className="h-6 w-6" aria-hidden />
    </button>
  )
}

const CarouselDots = ({
  count,
  currentIndex,
  onSelect,
  isClickable,
}: {
  count: number
  currentIndex: number
  onSelect: (index: number) => void
  isClickable: boolean
}) => (
  <div className="flex items-center gap-2">
    {Array.from({ length: count }, (_, index) => {
      const isActive = index === currentIndex
      const className = carouselDotStyles({ isActive })

      if (isClickable) {
        return (
          <button
            key={index}
            type="button"
            aria-current={isActive ? "true" : undefined}
            aria-label={`Go to slide ${index + 1} of ${count}`}
            className={className}
            onClick={() => onSelect(index)}
          />
        )
      }

      return <span key={index} aria-hidden className={className} />
    })}
  </div>
)

export const CarouselControls = ({
  slideCount,
  currentIndex,
  onSelect,
  onPrev,
  onNext,
  isDotsClickable,
  isPending,
  isDesktopOnly,
  hasTopMargin,
}: {
  slideCount: number
  currentIndex: number
  onSelect: (index: number) => void
  onPrev: () => void
  onNext: () => void
  isDotsClickable: boolean
  isPending: boolean
  isDesktopOnly?: boolean
  hasTopMargin?: boolean
}) => (
  <div className={carouselControlsStyles({ isDesktopOnly, hasTopMargin })}>
    <CarouselDots
      count={slideCount}
      currentIndex={currentIndex}
      onSelect={onSelect}
      isClickable={isDotsClickable}
    />
    <div className="flex items-center gap-2">
      <CarouselArrowButton
        direction="prev"
        onClick={onPrev}
        isDisabled={isPending}
      />
      <CarouselArrowButton
        direction="next"
        onClick={onNext}
        isDisabled={isPending}
      />
    </div>
  </div>
)
