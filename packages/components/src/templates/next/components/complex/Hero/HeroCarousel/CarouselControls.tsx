import { useEffect, useRef } from "react"
import { BiChevronLeft, BiChevronRight, BiPause, BiPlay } from "react-icons/bi"
import { tv } from "~/lib/tv"
import { twMerge } from "~/lib/twMerge"

import { HERO_CAROUSEL_ROTATION_INTERVAL_MS } from "./constants"

const carouselButtonClassName =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-transparent bg-white text-base-content shadow-sm hover:bg-white/90 focus-visible:outline focus-visible:outline-[0.25rem] focus-visible:outline-offset-[0.125rem] focus-visible:outline-utility-highlight"

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
    rotation: "",
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
        // Sit just to the left of the next arrow (right-14 / right-16 + 2.5rem
        // button + 0.5rem gap). `arrows` is `display: contents` from md, so
        // this positions against the controls overlay.
        rotation:
          "md:pointer-events-auto md:absolute md:right-[6.5rem] md:top-1/2 md:-translate-y-1/2 lg:right-[7rem]",
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
      className={twMerge(carouselButtonClassName, className)}
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

type Rotation = "rotating" | "stopped"

const COUNTDOWN_RADIUS = 18
const COUNTDOWN_CIRCUMFERENCE = 2 * Math.PI * COUNTDOWN_RADIUS

const RotationCountdown = ({
  elapsedMs,
  startedAt,
}: {
  elapsedMs: number
  startedAt: number | null
}) => {
  const progressRef = useRef<SVGCircleElement>(null)

  useEffect(() => {
    const progress = progressRef.current
    if (!progress) return

    const draw = (elapsed: number) => {
      const ratio = Math.min(elapsed / HERO_CAROUSEL_ROTATION_INTERVAL_MS, 1)
      progress.style.strokeDashoffset = String(
        COUNTDOWN_CIRCUMFERENCE * (1 - ratio),
      )
    }

    if (startedAt === null) {
      draw(elapsedMs)
      return
    }

    let frame = 0
    const tick = (now: number) => {
      draw(elapsedMs + (now - startedAt))
      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [elapsedMs, startedAt])

  return (
    <svg
      data-rotation-countdown=""
      data-chromatic="ignore"
      aria-hidden
      viewBox="0 0 40 40"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      <circle
        cx="20"
        cy="20"
        r={COUNTDOWN_RADIUS}
        fill="none"
        stroke="rgba(0,0,0,0.22)"
        strokeWidth="2"
      />
      <circle
        ref={progressRef}
        cx="20"
        cy="20"
        r={COUNTDOWN_RADIUS}
        fill="none"
        stroke="rgba(0,0,0,0.72)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={COUNTDOWN_CIRCUMFERENCE}
        strokeDashoffset={COUNTDOWN_CIRCUMFERENCE}
        transform="rotate(-90 20 20)"
      />
    </svg>
  )
}

const CarouselRotationButton = ({
  isRotating,
  showCountdown,
  elapsedMs,
  startedAt,
  onChange,
  className,
}: {
  isRotating: boolean
  showCountdown: boolean
  elapsedMs: number
  startedAt: number | null
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
      className={twMerge("relative inline-flex h-10 w-10 shrink-0", className)}
    >
      <button
        type="button"
        className={carouselButtonClassName}
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
        <RotationCountdown elapsedMs={elapsedMs} startedAt={startedAt} />
      )}
    </span>
  )
}

export const CarouselControls = ({
  slideCount,
  currentIndex,
  onPrev,
  onNext,
  rotation,
  className,
  isCenteredOnTablet,
}: {
  slideCount: number
  currentIndex: number
  onPrev: () => void
  onNext: () => void
  rotation?: {
    isRotating: boolean
    showCountdown: boolean
    elapsedMs: number
    startedAt: number | null
    onChange: (next: Rotation) => void
  }
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
        {rotation && (
          <CarouselRotationButton
            isRotating={rotation.isRotating}
            showCountdown={rotation.showCountdown}
            elapsedMs={rotation.elapsedMs}
            startedAt={rotation.startedAt}
            onChange={rotation.onChange}
            className={styles.rotation()}
          />
        )}
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
