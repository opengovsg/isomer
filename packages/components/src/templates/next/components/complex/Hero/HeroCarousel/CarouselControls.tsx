import { useRef } from "react"
import { BiPause, BiPlay } from "react-icons/bi"
import { tv } from "~/lib/tv"
import { twMerge } from "~/lib/twMerge"

import { HERO_CAROUSEL_ROTATION_INTERVAL_MS } from "./constants"

// pointer:coarse is a proxy for whether the user is using a touch-only pointer type.
const coarsePointerControlSizeClassName =
  "[@media(pointer:coarse)]:h-11 [@media(pointer:coarse)]:w-11"

// 16px gap between dots; h-6 buttons keep 24px-tall targets from overlapping.
const carouselDotButtonStyles = tv({
  base: "flex h-6 shrink-0 items-center justify-center focus-visible:outline focus-visible:outline-[0.25rem] focus-visible:outline-offset-[0.125rem] focus-visible:outline-utility-highlight",
  variants: {
    isActive: {
      true: "w-11",
      false: "w-[1.625rem]",
    },
  },
})

const carouselDotStyles = tv({
  base: "pointer-events-none h-2.5 shrink-0 rounded-full transition-[width,background-color] duration-150 ease-out motion-reduce:transition-none",
  variants: {
    isActive: {
      true: "w-7 bg-white",
      false: "w-2.5 bg-white/50",
    },
  },
})

// Pause is first in the DOM and dots are last, so tab order is pause, call to action, dots.
const carouselControlsStyles = tv({
  slots: {
    // Bottom row, right column, vertically centred with the dots.
    rotation: "col-start-2 row-start-2 self-center justify-self-end",
    // Bottom row, left column. w-fit stops the chip stretching across the row.
    dots: "col-start-1 row-start-2 flex w-fit items-center self-center justify-self-start",
    // Hugs the dot buttons; the photo scrim is added only for onPhoto.
    chip: "flex items-center",
  },
  variants: {
    onPhoto: {
      true: {
        // black/70: white/50 dots are 3:1 on white. black/60 is 2.72:1.
        chip: "rounded-full bg-black/70 px-2",
      },
    },
    isCenteredOnTablet: {
      true: {
        // From md, leave the grid and pin the pause to the content's right edge.
        rotation: "md:absolute md:bottom-9 md:right-10 md:z-10 lg:bottom-10",
        // From md, centre the dots on the copy. h-10 matches the pause so the chip stays centred on it.
        dots: "md:absolute md:bottom-9 md:left-1/2 md:z-10 md:h-10 md:-translate-x-1/2 md:items-center lg:bottom-10 [@media(pointer:coarse)]:md:h-11",
      },
    },
  },
})

type Rotation = "rotating" | "stopped"

interface CarouselRotationControl {
  isRotating: boolean
  showCountdown: boolean
  isPaused: boolean
  onChange: (next: Rotation) => void
}

const RotationCountdown = ({ isPaused }: { isPaused: boolean }) => {
  const radius = 18
  const circumference = 2 * Math.PI * radius
  const animation = "hero-carousel-countdown"
  const keyframes = `@keyframes ${animation} { from { stroke-dashoffset: ${circumference}; } to { stroke-dashoffset: 0; } }`

  return (
    <svg
      data-rotation-countdown=""
      data-chromatic="ignore"
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
          animationPlayState: isPaused ? "paused" : "running",
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
  isPaused,
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
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-transparent bg-white text-base-content shadow-sm [@media(hover:hover)]:hover:bg-gray-200 [@media(hover:hover)]:hover:shadow-md focus-visible:outline focus-visible:outline-[0.25rem] focus-visible:outline-offset-[0.125rem] focus-visible:outline-utility-highlight",
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
        <Icon className="h-6 w-6" aria-hidden />
      </button>
      {showCountdown && (
        <RotationCountdown key={currentIndex} isPaused={isPaused} />
      )}
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

export const CarouselDotsControl = ({
  slideCount,
  currentIndex,
  onGoTo,
  className,
  isCenteredOnTablet,
  onPhoto,
}: {
  slideCount: number
  currentIndex: number
  onGoTo: (index: number) => void
  className?: string
  isCenteredOnTablet?: boolean
  onPhoto?: boolean
}) => {
  const styles = carouselControlsStyles({ isCenteredOnTablet, onPhoto })

  return (
    <div className={styles.dots({ className })}>
      <div className={styles.chip()}>
        {Array.from({ length: slideCount }, (_, index) => {
          const isActive = index === currentIndex

          return (
            <button
              key={index}
              type="button"
              className={carouselDotButtonStyles({ isActive })}
              aria-label={`Go to slide ${index + 1} of ${slideCount}`}
              aria-current={isActive ? "true" : undefined}
              onClick={() => onGoTo(index)}
            >
              <span className={carouselDotStyles({ isActive })} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
