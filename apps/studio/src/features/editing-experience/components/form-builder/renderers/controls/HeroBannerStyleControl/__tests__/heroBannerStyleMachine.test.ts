import type { HeroProps } from "@opengovsg/isomer-components"
import { HERO_STYLE } from "@opengovsg/isomer-components"

import {
  closedHeroBannerStyleState,
  heroBannerStyleReducer,
  heroBannerStyleTransition,
  type HeroBannerStyleOrigin,
  type HeroBannerStyleState,
} from "../heroBannerStyleMachine"

function origin(
  hero: HeroProps,
  key: HeroBannerStyleOrigin["originKey"] = HERO_STYLE.carousel.key,
): HeroBannerStyleOrigin {
  return {
    originKey: key,
    originValue: key ?? "",
    hero,
  }
}

function carousel(slideCount: number): HeroProps {
  return {
    variant: HERO_STYLE.carousel.key,
    slides: Array.from({ length: slideCount }, () => ({})),
  } as HeroProps
}

const gradient = { variant: HERO_STYLE.gradient.key } as HeroProps

const multiSlideCarousel: HeroBannerStyleState = {
  status: "picking",
  origin: origin(carousel(3)),
}

const confirmingDiscard: HeroBannerStyleState = {
  status: "confirmingDiscard",
  origin: multiSlideCarousel.origin,
}

describe("heroBannerStyleReducer", () => {
  it("opens from closed into picking and keeps the origin snapshot", () => {
    // Arrange
    const snapshot = origin(carousel(2))

    // Act
    const next = heroBannerStyleReducer(closedHeroBannerStyleState, {
      type: "open",
      origin: snapshot,
    })

    // Assert
    expect(next).toEqual({ status: "picking", origin: snapshot })
  })

  it("ignores open once the drawer is already open", () => {
    // Arrange / Act
    const next = heroBannerStyleReducer(multiSlideCarousel, {
      type: "open",
      origin: origin(gradient, HERO_STYLE.gradient.key),
    })

    // Assert
    expect(next).toBe(multiSlideCarousel)
  })

  it.each([
    ["picking", multiSlideCarousel],
    ["confirming discard", confirmingDiscard],
  ] as const)("closes on back from %s", (_label, state) => {
    // Arrange / Act
    const next = heroBannerStyleReducer(state, {
      type: "back",
      selectedValue: HERO_STYLE.block.key,
    })

    // Assert
    expect(next).toBe(closedHeroBannerStyleState)
  })

  it("asks to discard when saving a style change off a multi-slide carousel", () => {
    // Arrange / Act
    const next = heroBannerStyleReducer(multiSlideCarousel, {
      type: "save",
      selectedKey: HERO_STYLE.block.key,
    })

    // Assert
    expect(next).toEqual({
      status: "confirmingDiscard",
      origin: multiSlideCarousel.origin,
    })
  })

  it.each([
    [
      "a carousel with a single slide",
      {
        status: "picking",
        origin: origin(carousel(1)),
      } satisfies HeroBannerStyleState,
      HERO_STYLE.block.key,
    ],
    ["the carousel style itself", multiSlideCarousel, HERO_STYLE.carousel.key],
    [
      "a hero that did not start as a carousel",
      {
        status: "picking",
        origin: origin(gradient, HERO_STYLE.gradient.key),
      } satisfies HeroBannerStyleState,
      HERO_STYLE.block.key,
    ],
  ] as const)("closes on save from %s", (_label, state, selectedKey) => {
    // Arrange / Act
    const next = heroBannerStyleReducer(state, { type: "save", selectedKey })

    // Assert
    expect(next).toBe(closedHeroBannerStyleState)
  })

  it("returns to picking when discard is cancelled", () => {
    // Arrange / Act
    const next = heroBannerStyleReducer(confirmingDiscard, {
      type: "cancelDiscard",
    })

    // Assert
    expect(next).toEqual({
      status: "picking",
      origin: confirmingDiscard.origin,
    })
  })

  it("closes when discard is confirmed", () => {
    // Arrange / Act
    const next = heroBannerStyleReducer(confirmingDiscard, {
      type: "confirmDiscard",
    })

    // Assert
    expect(next).toBe(closedHeroBannerStyleState)
  })

  it.each([
    [
      "back while closed",
      closedHeroBannerStyleState,
      { type: "back", selectedValue: HERO_STYLE.block.key } as const,
    ],
    [
      "save while closed",
      closedHeroBannerStyleState,
      { type: "save", selectedKey: HERO_STYLE.block.key } as const,
    ],
    [
      "cancel while picking",
      multiSlideCarousel,
      { type: "cancelDiscard" } as const,
    ],
    [
      "confirm while picking",
      multiSlideCarousel,
      { type: "confirmDiscard" } as const,
    ],
    [
      "save while confirming",
      confirmingDiscard,
      { type: "save", selectedKey: HERO_STYLE.block.key } as const,
    ],
  ])("ignores %s", (_label, state, action) => {
    // Arrange / Act
    const next = heroBannerStyleReducer(state, action)

    // Assert
    expect(next).toBe(state)
  })
})

describe("heroBannerStyleTransition effects", () => {
  it("restores the origin hero when that style is selected again", () => {
    // Arrange / Act
    const { state, effect } = heroBannerStyleTransition(multiSlideCarousel, {
      type: "select",
      value: multiSlideCarousel.origin.originValue,
    })

    // Assert
    expect(state).toBe(multiSlideCarousel)
    expect(effect).toEqual({
      type: "restore",
      origin: multiSlideCarousel.origin,
    })
  })

  it("writes a different style through without changing the picker", () => {
    // Arrange / Act
    const { state, effect } = heroBannerStyleTransition(multiSlideCarousel, {
      type: "select",
      value: HERO_STYLE.block.key,
    })

    // Assert
    expect(state).toBe(multiSlideCarousel)
    expect(effect).toEqual({ type: "select", value: HERO_STYLE.block.key })
  })

  it("restores on back when the live style differs from the origin", () => {
    // Arrange / Act
    const { effect } = heroBannerStyleTransition(multiSlideCarousel, {
      type: "back",
      selectedValue: HERO_STYLE.block.key,
    })

    // Assert
    expect(effect).toEqual({
      type: "restore",
      origin: multiSlideCarousel.origin,
    })
  })

  it("leaves the form alone on back when the live style is the origin", () => {
    // Arrange / Act
    const { effect } = heroBannerStyleTransition(multiSlideCarousel, {
      type: "back",
      selectedValue: multiSlideCarousel.origin.originValue,
    })

    // Assert
    expect(effect).toBeUndefined()
  })

  it("restores the origin hero when discard is cancelled", () => {
    // Arrange / Act
    const { effect } = heroBannerStyleTransition(confirmingDiscard, {
      type: "cancelDiscard",
    })

    // Assert
    expect(effect).toEqual({
      type: "restore",
      origin: confirmingDiscard.origin,
    })
  })

  it("writes nothing when discard is confirmed", () => {
    // Arrange / Act
    const { effect } = heroBannerStyleTransition(confirmingDiscard, {
      type: "confirmDiscard",
    })

    // Assert
    expect(effect).toBeUndefined()
  })

  it("writes nothing when a style is saved", () => {
    // Arrange / Act
    const { effect } = heroBannerStyleTransition(multiSlideCarousel, {
      type: "save",
      selectedKey: HERO_STYLE.carousel.key,
    })

    // Assert
    expect(effect).toBeUndefined()
  })
})
