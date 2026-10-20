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

const CarouselArrowButton = ({
  direction,
  onClick,
}: {
  direction: "prev" | "next"
  onClick: () => void
}) => {
  const Icon = direction === "prev" ? BiChevronLeft : BiChevronRight
  const label = direction === "prev" ? "Previous slide" : "Next slide"

  return (
    <button
      type="button"
      className="flex h-10 w-10 items-center justify-center rounded-full border border-transparent bg-white text-base-content shadow-sm hover:bg-white/90 focus-visible:outline focus-visible:outline-[0.25rem] focus-visible:outline-offset-[0.125rem] focus-visible:outline-utility-highlight"
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
}: {
  count: number
  currentIndex: number
}) => (
  <div className="flex items-center gap-2" aria-hidden>
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
}: {
  slideCount: number
  currentIndex: number
  onPrev: () => void
  onNext: () => void
  className?: string
}) => (
  <div
    className={twMerge(
      "flex w-full items-center justify-between gap-4",
      className,
    )}
  >
    <CarouselDots count={slideCount} currentIndex={currentIndex} />
    <div className="flex items-center gap-2">
      <CarouselArrowButton direction="prev" onClick={onPrev} />
      <CarouselArrowButton direction="next" onClick={onNext} />
    </div>
  </div>
)
