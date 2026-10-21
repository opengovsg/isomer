import { act, fireEvent, render, screen } from "@testing-library/react"
import { useState } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { userEvent } from "vitest/browser"
import { HERO_CAROUSEL_CONTENT_ALIGNMENT } from "~/interfaces/complex/Hero"

import { HERO_CAROUSEL_ROTATION_INTERVAL_MS } from "./constants"
import { HeroCarouselBlockClient } from "./HeroCarouselBlockClient"
import { HeroCarouselGradientClient } from "./HeroCarouselGradientClient"
import { HeroCarouselPreviewProvider } from "./HeroCarouselPreviewContext"

const shortSlide = {
  backgroundUrl: "/short.png",
  title: "Short",
  subtitle: "One line.",
  primaryLabel: "Start",
  primaryHref: "/",
}

const tallSlide = {
  backgroundUrl: "/tall.png",
  title: "A much longer title that wraps across many lines ".repeat(8),
  subtitle: "Extra subtitle copy that also wraps onto more lines. ".repeat(6),
  primaryLabel: "Continue",
  primaryHref: "/",
  secondaryLabel: "Details",
  secondaryHref: "/",
}

const carouselVariants = {
  block: (slides: (typeof shortSlide)[]) => (
    <HeroCarouselBlockClient headingTag="h1" slides={slides} />
  ),
  gradient: (slides: (typeof shortSlide)[]) => (
    <HeroCarouselGradientClient headingTag="h1" slides={slides} />
  ),
  "gradient centered": (slides: (typeof shortSlide)[]) => (
    <HeroCarouselGradientClient
      contentAlignment={HERO_CAROUSEL_CONTENT_ALIGNMENT.center}
      headingTag="h1"
      slides={slides}
    />
  ),
}

describe("hero carousel clients", () => {
  it.each(Object.entries(carouselVariants))(
    "keeps the %s carousel height and controls fixed across slides",
    (_name, renderVariant) => {
      // Arrange
      const view = render(renderVariant([shortSlide, tallSlide]))
      const section = view.container.querySelector("section")
      if (!section) {
        throw new Error("Expected a carousel section")
      }
      const next = screen.getByRole("button", { name: "Next slide" })
      const heightBefore = section.getBoundingClientRect().height
      const controlsTopBefore = next.getBoundingClientRect().top

      // Act
      fireEvent.click(next)

      // Assert
      expect(section.getBoundingClientRect().height).toBe(heightBefore)
      expect(next.getBoundingClientRect().top).toBe(controlsTopBefore)
    },
  )
})

const indexedSlides = [
  { backgroundUrl: "/a.png", title: "Alpha" },
  { backgroundUrl: "/b.png", title: "Beta" },
  { backgroundUrl: "/c.png", title: "Gamma" },
]

const liveRegion = () => screen.getByText(/Slide \d of \d:/)

describe("hero carousel preview index", () => {
  it("changes its own slide on next when no preview provider is present", async () => {
    // Arrange
    render(
      <HeroCarouselGradientClient headingTag="h1" slides={indexedSlides} />,
    )

    // Act
    await userEvent.click(screen.getByRole("button", { name: "Next slide" }))

    // Assert
    expect(liveRegion().textContent).toBe("Slide 2 of 3: Beta")
  })

  it("follows the preview index and sends next through setActiveIndex", async () => {
    // Arrange
    const Harness = () => {
      const [activeIndex, setActiveIndex] = useState(1)

      return (
        <HeroCarouselPreviewProvider value={{ activeIndex, setActiveIndex }}>
          <HeroCarouselGradientClient headingTag="h1" slides={indexedSlides} />
        </HeroCarouselPreviewProvider>
      )
    }

    render(<Harness />)

    // Act / Assert
    expect(liveRegion().textContent).toBe("Slide 2 of 3: Beta")

    await userEvent.click(screen.getByRole("button", { name: "Next slide" }))

    expect(liveRegion().textContent).toBe("Slide 3 of 3: Gamma")
  })
})

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)"

const linkedSlides = [
  shortSlide,
  {
    ...tallSlide,
    backgroundUrl: "/second.png",
    title: "Second",
    primaryLabel: "Continue",
  },
]

const renderGradient = (
  slides: typeof indexedSlides | typeof linkedSlides = indexedSlides,
) => {
  const view = render(
    <HeroCarouselGradientClient headingTag="h1" slides={slides} />,
  )
  const section = view.container.querySelector("section")
  if (!section) {
    throw new Error("Expected a carousel section")
  }
  return section
}

const rotationButton = () =>
  screen.getByRole("button", { name: /slide rotation/ })

const advanceRotation = (ms: number) => {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

const countdownProgress = (section: HTMLElement) => {
  const progress = section.querySelector<SVGCircleElement>(
    "[data-rotation-countdown] circle:last-of-type",
  )
  if (!progress) {
    throw new Error("Expected a countdown ring")
  }
  return {
    offset: Number(progress.style.strokeDashoffset),
    circumference: Number(progress.getAttribute("stroke-dasharray")),
  }
}

const tabbableIn = (section: HTMLElement) =>
  [
    ...section.querySelectorAll<HTMLElement>(
      "a[href], button, input, select, textarea, [tabindex]",
    ),
  ].filter((element) => {
    if (element.tabIndex < 0) {
      return false
    }
    if (element.closest("[inert]")) {
      return false
    }
    return element.checkVisibility()
  })

let prefersReducedMotion = false
const reducedMotionListeners = new Set<() => void>()
let documentHidden = false

const installBrowserStubs = () => {
  vi.spyOn(window, "matchMedia").mockImplementation((query: string) => {
    const matches =
      query === REDUCED_MOTION_QUERY ? prefersReducedMotion : false
    return {
      matches,
      media: query,
      addEventListener: (_event: string, listener: EventListener) => {
        reducedMotionListeners.add(listener as () => void)
      },
      removeEventListener: (_event: string, listener: EventListener) => {
        reducedMotionListeners.delete(listener as () => void)
      },
      dispatchEvent: () => false,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
    } as MediaQueryList
  })
  vi.spyOn(Document.prototype, "hidden", "get").mockImplementation(
    () => documentHidden,
  )
}

describe("hero carousel rotation", () => {
  beforeEach(() => {
    prefersReducedMotion = false
    documentHidden = false
    reducedMotionListeners.clear()
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] })
    installBrowserStubs()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it("advances after the interval and wraps from the last slide to slide 1", () => {
    // Arrange
    renderGradient()

    // Act
    advanceRotation(HERO_CAROUSEL_ROTATION_INTERVAL_MS - 1)

    // Assert
    expect(liveRegion().textContent).toBe("Slide 1 of 3: Alpha")

    // Act
    advanceRotation(1)

    // Assert
    expect(liveRegion().textContent).toBe("Slide 2 of 3: Beta")

    // Act
    advanceRotation(HERO_CAROUSEL_ROTATION_INTERVAL_MS)

    // Assert
    expect(liveRegion().textContent).toBe("Slide 3 of 3: Gamma")

    // Act
    advanceRotation(HERO_CAROUSEL_ROTATION_INTERVAL_MS)

    // Assert
    expect(liveRegion().textContent).toBe("Slide 1 of 3: Alpha")
  })

  it("does not advance after the pause button is pressed", () => {
    // Arrange
    const section = renderGradient()
    expect(section.querySelector("[data-rotation-countdown]")).toBeTruthy()

    // Act
    fireEvent.click(rotationButton())
    advanceRotation(HERO_CAROUSEL_ROTATION_INTERVAL_MS)

    // Assert
    expect(liveRegion().textContent).toBe("Slide 1 of 3: Alpha")
    expect(rotationButton()).toHaveAccessibleName("Start slide rotation")
    expect(section.querySelector("[data-rotation-countdown]")).toBeNull()
  })

  it("does not advance after next is pressed", () => {
    // Arrange
    renderGradient()

    // Act
    fireEvent.click(screen.getByRole("button", { name: "Next slide" }))
    advanceRotation(HERO_CAROUSEL_ROTATION_INTERVAL_MS)

    // Assert
    expect(liveRegion().textContent).toBe("Slide 2 of 3: Beta")
  })

  it("does not advance after previous is pressed", () => {
    // Arrange
    renderGradient()

    // Act
    fireEvent.click(screen.getByRole("button", { name: "Previous slide" }))
    advanceRotation(HERO_CAROUSEL_ROTATION_INTERVAL_MS)

    // Assert
    expect(liveRegion().textContent).toBe("Slide 3 of 3: Gamma")
  })

  it("does not advance after focus enters a slide call to action", () => {
    // Arrange
    renderGradient(linkedSlides)
    const callToAction = screen.getByRole("link", { name: "Start" })

    // Act
    act(() => {
      callToAction.focus()
    })
    advanceRotation(HERO_CAROUSEL_ROTATION_INTERVAL_MS)

    // Assert
    expect(liveRegion().textContent).toBe("Slide 1 of 2: Short")
    expect(rotationButton()).toHaveAccessibleName("Start slide rotation")
  })

  it("does not advance after focus enters the pause button", () => {
    // Arrange
    renderGradient()
    const pause = screen.getByRole("button", { name: "Pause slide rotation" })

    // Act
    act(() => {
      pause.focus()
    })
    advanceRotation(HERO_CAROUSEL_ROTATION_INTERVAL_MS)

    // Assert
    expect(liveRegion().textContent).toBe("Slide 1 of 3: Alpha")
    expect(rotationButton()).toHaveAccessibleName("Start slide rotation")
  })

  it("restarts rotation on play without stopping again from the existing focus", () => {
    // Arrange
    renderGradient()
    const pause = screen.getByRole("button", { name: "Pause slide rotation" })
    act(() => {
      pause.focus()
    })

    // Act
    fireEvent.click(
      screen.getByRole("button", { name: "Start slide rotation" }),
    )

    // Assert
    expect(rotationButton()).toHaveAccessibleName("Pause slide rotation")

    // Act
    advanceRotation(HERO_CAROUSEL_ROTATION_INTERVAL_MS - 1)

    // Assert
    expect(liveRegion().textContent).toBe("Slide 1 of 3: Alpha")

    // Act
    advanceRotation(1)

    // Assert
    expect(liveRegion().textContent).toBe("Slide 2 of 3: Beta")
    expect(rotationButton()).toHaveAccessibleName("Pause slide rotation")
  })

  it("freezes the countdown while hovered and continues the remaining time", () => {
    // Arrange
    const section = renderGradient()
    const halfway = HERO_CAROUSEL_ROTATION_INTERVAL_MS / 2
    advanceRotation(halfway)

    // Act
    fireEvent.pointerEnter(section)
    advanceRotation(HERO_CAROUSEL_ROTATION_INTERVAL_MS)

    // Assert
    expect(liveRegion().textContent).toBe("Slide 1 of 3: Alpha")
    expect(rotationButton()).toHaveAccessibleName("Pause slide rotation")
    const frozen = countdownProgress(section)
    expect(frozen.offset).toBeCloseTo(frozen.circumference / 2, 0)

    // Act
    advanceRotation(HERO_CAROUSEL_ROTATION_INTERVAL_MS)

    // Assert
    expect(countdownProgress(section).offset).toBeCloseTo(frozen.offset, 0)

    // Act
    fireEvent.pointerLeave(section)
    advanceRotation(halfway - 1)

    // Assert
    expect(liveRegion().textContent).toBe("Slide 1 of 3: Alpha")

    // Act
    advanceRotation(1)

    // Assert
    expect(liveRegion().textContent).toBe("Slide 2 of 3: Beta")
  })

  it("starts a full interval when play is pressed while the pointer is still inside", () => {
    // Arrange
    const section = renderGradient()
    fireEvent.pointerEnter(section)
    fireEvent.click(screen.getByRole("button", { name: "Next slide" }))

    // Act
    fireEvent.click(
      screen.getByRole("button", { name: "Start slide rotation" }),
    )

    // Assert
    expect(rotationButton()).toHaveAccessibleName("Pause slide rotation")
    expect(section.querySelector("[data-rotation-countdown]")).toBeTruthy()
    expect(liveRegion().textContent).toBe("Slide 2 of 3: Beta")

    // Act
    advanceRotation(HERO_CAROUSEL_ROTATION_INTERVAL_MS - 1)

    // Assert
    expect(liveRegion().textContent).toBe("Slide 2 of 3: Beta")

    // Act
    advanceRotation(1)

    // Assert
    expect(liveRegion().textContent).toBe("Slide 3 of 3: Gamma")
  })

  it("pauses the timer while the document is hidden and restarts a full interval when it is visible", () => {
    // Arrange
    renderGradient()
    advanceRotation(HERO_CAROUSEL_ROTATION_INTERVAL_MS - 1)

    // Act
    act(() => {
      documentHidden = true
      document.dispatchEvent(new Event("visibilitychange"))
    })
    advanceRotation(HERO_CAROUSEL_ROTATION_INTERVAL_MS)

    // Assert
    expect(liveRegion().textContent).toBe("Slide 1 of 3: Alpha")

    // Act
    act(() => {
      documentHidden = false
      document.dispatchEvent(new Event("visibilitychange"))
    })
    advanceRotation(HERO_CAROUSEL_ROTATION_INTERVAL_MS - 1)

    // Assert
    expect(liveRegion().textContent).toBe("Slide 1 of 3: Alpha")

    // Act
    advanceRotation(1)

    // Assert
    expect(liveRegion().textContent).toBe("Slide 2 of 3: Beta")
  })

  it("starts stopped when reduced motion is requested", () => {
    // Arrange
    prefersReducedMotion = true
    renderGradient()

    // Act
    advanceRotation(HERO_CAROUSEL_ROTATION_INTERVAL_MS)

    // Assert
    expect(liveRegion().textContent).toBe("Slide 1 of 3: Alpha")
    expect(rotationButton()).toHaveAccessibleName("Start slide rotation")
  })

  it("stops rotation when reduced motion is turned on mid-session", () => {
    // Arrange
    renderGradient()
    advanceRotation(HERO_CAROUSEL_ROTATION_INTERVAL_MS - 1)

    // Act
    act(() => {
      prefersReducedMotion = true
      reducedMotionListeners.forEach((listener) => listener())
    })
    advanceRotation(HERO_CAROUSEL_ROTATION_INTERVAL_MS)

    // Assert
    expect(liveRegion().textContent).toBe("Slide 1 of 3: Alpha")
    expect(rotationButton()).toHaveAccessibleName("Start slide rotation")
  })

  it("does not rotate in the studio preview and renders the button stopped", () => {
    // Arrange
    const Harness = () => {
      const [activeIndex, setActiveIndex] = useState(0)

      return (
        <HeroCarouselPreviewProvider value={{ activeIndex, setActiveIndex }}>
          <HeroCarouselGradientClient headingTag="h1" slides={indexedSlides} />
        </HeroCarouselPreviewProvider>
      )
    }
    render(<Harness />)

    // Act
    advanceRotation(HERO_CAROUSEL_ROTATION_INTERVAL_MS)
    fireEvent.click(rotationButton())
    advanceRotation(HERO_CAROUSEL_ROTATION_INTERVAL_MS)

    // Assert
    expect(liveRegion().textContent).toBe("Slide 1 of 3: Alpha")
    expect(rotationButton()).toHaveAccessibleName("Start slide rotation")
  })

  it.each(Object.entries(carouselVariants))(
    "puts the pause button first in the %s carousel, swapping label and icon without aria-pressed",
    (_name, renderVariant) => {
      // Arrange
      const view = render(renderVariant([shortSlide, tallSlide]))
      const section = view.container.querySelector("section")
      if (!section) {
        throw new Error("Expected a carousel section")
      }
      const pause = screen.getByRole("button", { name: "Pause slide rotation" })
      const icon = pause.querySelector("svg")?.innerHTML

      // Act / Assert
      expect(tabbableIn(section)[0]).toBe(pause)
      expect(pause).toHaveAttribute("type", "button")
      expect(pause).not.toHaveAttribute("aria-pressed")

      // Act
      fireEvent.click(pause)

      // Assert
      const play = screen.getByRole("button", { name: "Start slide rotation" })
      expect(play).not.toHaveAttribute("aria-pressed")
      expect(play.querySelector("svg")?.innerHTML).not.toBe(icon)
    },
  )

  it("keeps the live region silent while rotating and announces only when the slide changes", () => {
    // Arrange
    renderGradient()
    const region = liveRegion()
    const textWhileRotating = region.textContent

    // Act / Assert
    expect(region).toHaveAttribute("aria-live", "off")

    advanceRotation(HERO_CAROUSEL_ROTATION_INTERVAL_MS)

    expect(region).toHaveAttribute("aria-live", "off")
    expect(region.textContent).toBe("Slide 2 of 3: Beta")

    // Act
    fireEvent.click(
      screen.getByRole("button", { name: "Pause slide rotation" }),
    )

    // Assert
    expect(region).toHaveAttribute("aria-live", "polite")
    expect(region.textContent).toBe("Slide 2 of 3: Beta")
    expect(region.textContent).not.toBe(textWhileRotating)

    // Act
    fireEvent.click(screen.getByRole("button", { name: "Next slide" }))

    // Assert
    expect(region).toHaveAttribute("aria-live", "polite")
    expect(region.textContent).toBe("Slide 3 of 3: Gamma")
  })

  it("keeps inactive slides inert and hidden from assistive tech through rotation", () => {
    // Arrange
    const section = renderGradient()
    // Inert slides are removed from the accessibility tree, so role queries
    // only see the current slide. Read the attribute from the DOM.
    const slideGroups = () => [
      ...section.querySelectorAll<HTMLElement>('[role="group"]'),
    ]
    const imageFrames = () =>
      [...section.querySelectorAll("img")].map((image) => image.parentElement!)

    // Act
    advanceRotation(HERO_CAROUSEL_ROTATION_INTERVAL_MS)

    // Assert
    const groups = slideGroups()
    expect(groups[0]).toHaveAttribute("inert")
    expect(groups[1]).not.toHaveAttribute("inert")
    expect(groups[2]).toHaveAttribute("inert")
    expect(imageFrames()[0]).toHaveAttribute("aria-hidden", "true")
    expect(imageFrames()[1]).toHaveAttribute("aria-hidden", "false")
    expect(imageFrames()[2]).toHaveAttribute("aria-hidden", "true")
  })

  it("renders one slide without a rotation control, timer, or live region", () => {
    // Arrange
    render(
      <HeroCarouselGradientClient
        headingTag="h1"
        slides={[indexedSlides[0]!]}
      />,
    )

    // Act
    advanceRotation(HERO_CAROUSEL_ROTATION_INTERVAL_MS)

    // Assert
    expect(
      screen.queryByRole("button", { name: /slide rotation/ }),
    ).not.toBeInTheDocument()
    expect(screen.queryByText(/Slide \d of \d:/)).not.toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Alpha" })).toBeInTheDocument()
  })
})
