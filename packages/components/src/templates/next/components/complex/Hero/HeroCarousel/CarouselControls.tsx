import { BiChevronLeft, BiChevronRight } from "react-icons/bi"

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
  dotClassName,
}: {
  count: number
  currentIndex: number
  onSelect: (index: number) => void
  isClickable: boolean
  dotClassName: { active: string; inactive: string }
}) => (
  <div
    className="flex items-center gap-2"
    role={isClickable ? "tablist" : undefined}
    aria-label={isClickable ? "Carousel slides" : undefined}
  >
    {Array.from({ length: count }, (_, index) => {
      const isActive = index === currentIndex
      const className = isActive ? dotClassName.active : dotClassName.inactive

      if (isClickable) {
        return (
          <button
            key={index}
            type="button"
            role="tab"
            aria-selected={isActive}
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
  className,
  dotClassName,
}: {
  slideCount: number
  currentIndex: number
  onSelect: (index: number) => void
  onPrev: () => void
  onNext: () => void
  isDotsClickable: boolean
  isPending: boolean
  className: string
  dotClassName: { active: string; inactive: string }
}) => (
  <div className={className}>
    <CarouselDots
      count={slideCount}
      currentIndex={currentIndex}
      onSelect={onSelect}
      isClickable={isDotsClickable}
      dotClassName={dotClassName}
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
