import { useEffect, useState } from "react"

const FLASH_HOLD_DURATION_MS = 400
const FLASH_FADE_DURATION_MS = 900

export const BLOCK_FLASH_FADE_DURATION_MS = FLASH_FADE_DURATION_MS

interface UseBlockFlashHighlightParams {
  flashBlockIndex: number | null
  onFlashEnd: () => void
}

interface UseBlockFlashHighlightReturn {
  isFading: boolean
}

// Drives the timing for the click-to-scroll flash highlight: hold at full
// opacity so the fade is noticeable, then fade out and clear the flash state.
export const useBlockFlashHighlight = ({
  flashBlockIndex,
  onFlashEnd,
}: UseBlockFlashHighlightParams): UseBlockFlashHighlightReturn => {
  const [isFading, setIsFading] = useState(false)

  useEffect(() => {
    if (flashBlockIndex === null) {
      setIsFading(false)
      return
    }

    setIsFading(false)
    const fadeTimeout = setTimeout(
      () => setIsFading(true),
      FLASH_HOLD_DURATION_MS,
    )
    const endTimeout = setTimeout(
      onFlashEnd,
      FLASH_HOLD_DURATION_MS + FLASH_FADE_DURATION_MS,
    )

    return () => {
      clearTimeout(fadeTimeout)
      clearTimeout(endTimeout)
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [flashBlockIndex])

  return { isFading }
}
