import { useRef } from "react"
import { BiChevronLeft, BiChevronRight, BiPause, BiPlay } from "react-icons/bi"
import { tv } from "~/lib/tv"
import { twMerge } from "~/lib/twMerge"

import { HERO_CAROUSEL_ROTATION_INTERVAL_MS } from "./constants"

// pointer:coarse is a proxy for whether the user is using a touch-only pointer type.
const coarsePointerControlSizeClassName =
  "[@media(pointer:coarse)]:h-11 [@media(pointer:coarse)]:w-11"

// Pause is first in the DOM and slide navigation is last, so tab order is
// pause, call to action, previous, next.
const carouselControlsStyles = tv({
  slots: {
    // Bottom row, right column, vertically centred with the slide position.
    rotation: "col-start-2 row-start-2 self-center justify-self-end",
    // Bottom row, left column. w-fit stops the chip stretching across the row.
    position:
      "col-start-1 row-start-2 flex w-fit items-center self-center justify-self-start",
    chip: "flex h-10 items-center rounded-full px-1 [@media(pointer:coarse)]:h-11",
  },
  variants: {
    // White on black/70 stays above 4.5:1 even over a white photo.
    // Controls on the solid base block inherit its inverse text colour.
    hasBackdrop: {
      true: {
        chip: "bg-black/70 text-white",
      },
    },
    isCenteredOnTablet: {
      true: {
        // From md, leave the grid and pin the pause to the hero's right edge.
        rotation: "md:absolute md:bottom-9 md:right-10 md:z-10 lg:bottom-10",
        // From md, centre the position chip on the hero. h-10 matches the pause.
        position:
          "md:absolute md:bottom-9 md:left-1/2 md:z-10 md:h-10 md:-translate-x-1/2 md:items-center lg:bottom-10 [@media(pointer:coarse)]:md:h-11",
      },
    },
  },
  defaultVariants: {
    hasBackdrop: true,
  },
})

// BiPlay's triangle sits left of its viewBox centre; pause is symmetric.
const rotationIconStyles = tv({
  base: "h-6 w-6",
  variants: {
    isPlaying: {
      true: "translate-x-0.5",
    },
  },
})

type Rotation = "rotating" | "stopped"

interface CarouselRotationControl {
  isRotating: boolean
  showCountdown: boolean
  onChange: (next: Rotation) => void
}

const RotationCountdown = () => {
  const radius = 18
  const circumference = 2 * Math.PI * radius
  const animation = "hero-carousel-countdown"
  const keyframes = `@keyframes ${animation} { from { stroke-dashoffset: ${circumference}; } to { stroke-dashoffset: 0; } }`

  // The ring advances every frame. Argos hides it in snapshots.
  return (
    <svg
      data-rotation-countdown=""
      data-visual-test="transparent"
      aria-hidden
      viewBox="0 0 40 40"
      className="pointer-events-none absolute inset-0 h-full w-full motion-reduce:hidden"
    >
      <style>{keyframes}</style>
      <circle
        cx="20"
        cy="20"
        r={radius}
        fill="none"
        stroke="rgba(0,0,0,0.22)"
        strokeWidth="2"
      />
      <circle
        cx="20"
        cy="20"
        r={radius}
        fill="none"
        stroke="rgba(0,0,0,0.72)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference}
        transform="rotate(-90 20 20)"
        style={{
          animation: `${animation} ${HERO_CAROUSEL_ROTATION_INTERVAL_MS}ms linear forwards`,
        }}
      />
    </svg>
  )
}

const CarouselRotationButton = ({
  currentIndex,
  className,
  isRotating,
  showCountdown,
  onChange,
}: CarouselRotationControl & {
  currentIndex: number
  className?: string
}) => {
  // Pointerdown runs before focusin. Focusing the button stops rotation and
  // re-renders, so the click that follows must apply the action captured
  // here. An unfocused Pause click focuses the button, which stops rotation,
  // and the click then toggles it back to playing.
  const intendedRotation = useRef<Rotation | null>(null)
  const label = isRotating ? "Pause slide rotation" : "Start slide rotation"
  const Icon = isRotating ? BiPause : BiPlay

  return (
    <span
      className={twMerge(
        "relative inline-flex h-10 w-10 shrink-0",
        coarsePointerControlSizeClassName,
        className,
      )}
    >
      <button
        type="button"
        className={twMerge(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-transparent bg-white text-base-content shadow-none [@media(hover:hover)]:hover:bg-gray-200 [@media(hover:hover)]:hover:shadow-none focus-visible:outline focus-visible:outline-[0.25rem] focus-visible:outline-offset-[0.125rem] focus-visible:outline-utility-highlight",
          coarsePointerControlSizeClassName,
        )}
        aria-label={label}
        onPointerDown={() => {
          intendedRotation.current = isRotating ? "stopped" : "rotating"
        }}
        onClick={(event) => {
          const toggled = isRotating ? "stopped" : "rotating"
          const next =
            event.detail === 0 || intendedRotation.current === null
              ? toggled
              : intendedRotation.current
          intendedRotation.current = null
          onChange(next)
        }}
      >
        <Icon
          className={rotationIconStyles({ isPlaying: !isRotating })}
          aria-hidden
        />
      </button>
      {showCountdown && <RotationCountdown key={currentIndex} />}
    </span>
  )
}

export const CarouselPauseControl = ({
  currentIndex,
  rotation,
  className,
  isCenteredOnTablet,
}: {
  currentIndex: number
  rotation?: CarouselRotationControl
  className?: string
  isCenteredOnTablet?: boolean
}) => {
  const styles = carouselControlsStyles({ isCenteredOnTablet })

  if (!rotation) {
    return null
  }

  return (
    <CarouselRotationButton
      currentIndex={currentIndex}
      className={styles.rotation({ className })}
      {...rotation}
    />
  )
}

const CarouselNavButton = ({
  label,
  onClick,
  icon: Icon,
}: {
  label: string
  onClick: () => void
  icon: typeof BiChevronLeft
}) => (
  <button
    type="button"
    className={twMerge(
      "flex size-8 shrink-0 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-[0.25rem] focus-visible:outline-offset-[0.125rem] focus-visible:outline-utility-highlight [@media(hover:hover)]:hover:bg-white/20",
      coarsePointerControlSizeClassName,
    )}
    aria-label={label}
    onClick={onClick}
  >
    <Icon className="h-6 w-6" aria-hidden />
  </button>
)

export const CarouselPositionControl = ({
  slideCount,
  currentIndex,
  onPrev,
  onNext,
  className,
  isCenteredOnTablet,
  hasBackdrop = true,
}: {
  slideCount: number
  currentIndex: number
  onPrev: () => void
  onNext: () => void
  className?: string
  isCenteredOnTablet?: boolean
  hasBackdrop?: boolean
}) => {
  const styles = carouselControlsStyles({ isCenteredOnTablet, hasBackdrop })

  if (slideCount < 2) {
    return null
  }

  return (
    <div className={styles.position({ className })}>
      <div className={styles.chip()}>
        <CarouselNavButton
          label="Previous slide"
          onClick={onPrev}
          icon={BiChevronLeft}
        />
        <p className="prose-label-md-medium min-w-[4.25rem] px-1 text-center tabular-nums">
          {currentIndex + 1} of {slideCount}
        </p>
        <CarouselNavButton
          label="Next slide"
          onClick={onNext}
          icon={BiChevronRight}
        />
      </div>
    </div>
  )
}
