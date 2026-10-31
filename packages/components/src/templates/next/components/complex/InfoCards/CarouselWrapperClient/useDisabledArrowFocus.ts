import { useEffect, useRef } from "react"

interface UseDisabledArrowFocusProps {
  showControls: boolean
  pageIndex: number
  isLastPage: boolean
}

// A disabled arrow cannot keep focus, so move it to the arrow that still works.
export const useDisabledArrowFocus = ({
  showControls,
  pageIndex,
  isLastPage,
}: UseDisabledArrowFocusProps) => {
  const previousButtonRef = useRef<HTMLButtonElement>(null)
  const nextButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!showControls) return
    const active = document.activeElement
    if (pageIndex === 0 && active === previousButtonRef.current) {
      nextButtonRef.current?.focus()
    }
    if (isLastPage && active === nextButtonRef.current) {
      previousButtonRef.current?.focus()
    }
  }, [isLastPage, pageIndex, showControls])

  return { previousButtonRef, nextButtonRef }
}
