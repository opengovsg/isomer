import { useRef } from "react"
import { BiPause, BiPlay } from "react-icons/bi"
import { tv } from "~/lib/tv"
import { twMerge } from "~/lib/twMerge"

import { HERO_CAROUSEL_ROTATION_INTERVAL_MS } from "./constants"

const carouselButtonClassName =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-transparent bg-white text-base-content shadow-sm [@media(hover:hover)]:hover:bg-gray-200 [@media(hover:hover)]:hover:shadow-md focus-visible:outline focus-visible:outline-[0.25rem] focus-visible:outline-offset-[0.125rem] focus-visible:outline-utility-highlight"

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

const carouselControlsStyles = tv({
  slots: {
    root: "flex w-full items-center justify-between gap-4",
    dots: "flex items-center",
    rotation: "",
  },
  variants: {
    onPhoto: {
      true: {
        // black/70: white/50 dots are 3:1 on white. black/60 is 2.72:1.
        dots: "rounded-full bg-black/70 px-2",
      },
    },
    // md+: dots on the centred copy line, pause on the right. pointer-events-none
    // on the row so copy at the bottom stays clickable.
    isCenteredOnTablet: {
      true: {
        root: "md:pointer-events-none md:absolute md:inset-x-0 md:bottom-9 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:px-10 lg:bottom-10",
        dots: "md:pointer-events-auto md:col-start-2 md:justify-self-center",
        rotation: "md:pointer-events-auto md:col-start-3 md:justify-self-end",
      },
    },
  },
})

const CarouselDots = ({
  count,
  currentIndex,
  onGoTo,
  className,
}: {
  count: number
  currentIndex: number
  onGoTo: (index: number) => void
  className?: string
}) => (
  <div className={className}>
    {Array.from({ length: count }, (_, index) => {
      const isActive = index === currentIndex

      return (
        <button
          key={index}
          type="button"
          className={carouselDotButtonStyles({ isActive })}
          aria-label={`Go to slide ${index + 1} of ${count}`}
          aria-current={isActive ? "true" : undefined}
          onClick={() => onGoTo(index)}
        >
          <span className={carouselDotStyles({ isActive })} />
        </button>
      )
    })}
  </div>
)

type Rotation = "rotating" | "stopped"

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
  isRotating,
  showCountdown,
  isPaused,
  currentIndex,
  onChange,
  className,
}: {
  isRotating: boolean
  showCountdown: boolean
  isPaused: boolean
  currentIndex: number
  onChange: (next: Rotation) => void
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
          carouselButtonClassName,
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

export const CarouselControls = ({
  slideCount,
  currentIndex,
  onGoTo,
  rotation,
  className,
  isCenteredOnTablet,
  onPhoto,
}: {
  slideCount: number
  currentIndex: number
  onGoTo: (index: number) => void
  rotation?: {
    isRotating: boolean
    showCountdown: boolean
    isPaused: boolean
    onChange: (next: Rotation) => void
  }
  className?: string
  isCenteredOnTablet?: boolean
  onPhoto?: boolean
}) => {
  const styles = carouselControlsStyles({ isCenteredOnTablet, onPhoto })

  return (
    <div className={styles.root({ className })}>
      <CarouselDots
        count={slideCount}
        currentIndex={currentIndex}
        onGoTo={onGoTo}
        className={styles.dots()}
      />
      {rotation && (
        <CarouselRotationButton
          isRotating={rotation.isRotating}
          showCountdown={rotation.showCountdown}
          isPaused={rotation.isPaused}
          currentIndex={currentIndex}
          onChange={rotation.onChange}
          className={styles.rotation()}
        />
      )}
    </div>
  )
}
