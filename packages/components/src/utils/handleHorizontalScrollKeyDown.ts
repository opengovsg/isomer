import type { KeyboardEvent } from "react"

export const handleHorizontalScrollKeyDown = (
  event: KeyboardEvent<HTMLElement>,
) => {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
    return
  }

  event.preventDefault()
  const scrollAmount = 80
  event.currentTarget.scrollLeft +=
    event.key === "ArrowRight" ? scrollAmount : -scrollAmount
}
