import {
  HERO_STYLE,
  type HeroProps,
  type HeroStyleVariant,
} from "@opengovsg/isomer-components"

// Closed, picking a style, or confirming that extra carousel slides will be
// dropped. The origin snapshot exists only while the drawer is open, so
// closing cannot restore a stale hero. `effect` is the form write that goes
// with a transition; the component performs it.
export interface HeroBannerStyleOrigin {
  originKey: HeroStyleVariant | undefined
  originValue: string
  hero: HeroProps
}

export type HeroBannerStyleState =
  | { status: "closed" }
  | { status: "picking"; origin: HeroBannerStyleOrigin }
  | { status: "confirmingDiscard"; origin: HeroBannerStyleOrigin }

export type HeroBannerStyleEffect =
  | { type: "restore"; origin: HeroBannerStyleOrigin }
  | { type: "select"; value: string }

export type HeroBannerStyleAction =
  | { type: "open"; origin: HeroBannerStyleOrigin }
  | { type: "select"; value: string }
  | { type: "back"; selectedValue: string | undefined }
  | { type: "save"; selectedKey: HeroStyleVariant | undefined }
  | { type: "cancelDiscard" }
  | { type: "confirmDiscard" }

export interface HeroBannerStyleTransition {
  state: HeroBannerStyleState
  effect?: HeroBannerStyleEffect
}

export const closedHeroBannerStyleState: HeroBannerStyleState = {
  status: "closed",
}

export function heroSlideCount(hero: HeroProps) {
  return "slides" in hero ? hero.slides.length : 0
}

function leavingCarouselWithExtraSlides(
  origin: HeroBannerStyleOrigin,
  selectedKey: HeroStyleVariant | undefined,
) {
  return (
    origin.originKey === HERO_STYLE.carousel.key &&
    selectedKey !== HERO_STYLE.carousel.key &&
    heroSlideCount(origin.hero) > 1
  )
}

function stay(state: HeroBannerStyleState): HeroBannerStyleTransition {
  return { state }
}

export function heroBannerStyleTransition(
  state: HeroBannerStyleState,
  action: HeroBannerStyleAction,
): HeroBannerStyleTransition {
  switch (action.type) {
    case "open":
      if (state.status !== "closed") {
        return stay(state)
      }
      return { state: { status: "picking", origin: action.origin } }
    case "select":
      if (state.status === "closed") {
        return stay(state)
      }
      // The style the drawer opened on restores that hero. Any other style is
      // written through so the preview updates immediately.
      if (action.value === state.origin.originValue) {
        return {
          state,
          effect: { type: "restore", origin: state.origin },
        }
      }
      return { state, effect: { type: "select", value: action.value } }
    case "back":
      if (state.status === "closed") {
        return stay(state)
      }
      if (action.selectedValue === state.origin.originValue) {
        return { state: closedHeroBannerStyleState }
      }
      return {
        state: closedHeroBannerStyleState,
        effect: { type: "restore", origin: state.origin },
      }
    case "save":
      if (state.status !== "picking") {
        return stay(state)
      }
      if (leavingCarouselWithExtraSlides(state.origin, action.selectedKey)) {
        return { state: { status: "confirmingDiscard", origin: state.origin } }
      }
      return { state: closedHeroBannerStyleState }
    case "cancelDiscard":
      if (state.status !== "confirmingDiscard") {
        return stay(state)
      }
      return {
        state: { status: "picking", origin: state.origin },
        effect: { type: "restore", origin: state.origin },
      }
    case "confirmDiscard":
      if (state.status !== "confirmingDiscard") {
        return stay(state)
      }
      return { state: closedHeroBannerStyleState }
  }
}

export function heroBannerStyleReducer(
  state: HeroBannerStyleState,
  action: HeroBannerStyleAction,
): HeroBannerStyleState {
  return heroBannerStyleTransition(state, action).state
}
