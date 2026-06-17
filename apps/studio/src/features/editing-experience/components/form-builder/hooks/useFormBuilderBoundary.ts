import { useRef } from "react"

import { FORM_BUILDER_PARENT_ID } from "../constants"

/**
 * The form builder scrolls inside `FORM_BUILDER_PARENT_ID`. react-aria flips a Menu/Popover
 * against `document.body` by default, which is taller than the viewport here — so a menu
 * triggered near the bottom opens downward and is clipped instead of flipping. Pointing the
 * popover's collision boundary + scroll tracking at the scroll container makes it flip relative
 * to the container's visible box (≈ the viewport edge). Spread onto an OUI `Menu`:
 * `<Menu {...useFormBuilderBoundary()} />`.
 *
 * The boundary is resolved during render (not via an effect) so it is present on the popover's
 * first position calc — otherwise the menu positions before the boundary arrives and only flips
 * on a later reposition (e.g. a resize). A menu is always a descendant of the container, so the
 * element exists by the time this runs.
 */
export const useFormBuilderBoundary = () => {
  const scrollRef = useRef<HTMLElement | null>(null)
  scrollRef.current =
    typeof document === "undefined"
      ? null
      : document.getElementById(FORM_BUILDER_PARENT_ID)

  return { boundaryElement: scrollRef.current ?? undefined, scrollRef }
}
