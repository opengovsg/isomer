import { BLOCK_FLASH_FADE_DURATION_MS } from "~/features/editing-experience/hooks/useBlockFlashHighlight"

interface BlockHighlightOverlayProps {
  top: number
  left: number
  width: number
  height: number
  label?: string
  // When true, fades the overlay out — used for the lingering flash shown
  // after a click-to-scroll, as opposed to the hover highlight which just
  // tracks the cursor at full opacity.
  isFading?: boolean
}

export const BlockHighlightOverlay = ({
  top,
  left,
  width,
  height,
  label,
  isFading = false,
}: BlockHighlightOverlayProps): JSX.Element => {
  return (
    <div
      style={{
        position: "absolute",
        top,
        left,
        width,
        height,
        outline: "2px solid #2164DA",
        outlineOffset: "2px",
        backgroundColor: "rgba(33, 100, 218, 0.12)",
        pointerEvents: "none",
        zIndex: 9999,
        opacity: isFading ? 0 : 1,
        transition: `opacity ${BLOCK_FLASH_FADE_DURATION_MS}ms ease-out`,
      }}
    >
      {label && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            padding: "2px 8px",
            fontSize: "12px",
            lineHeight: 1.5,
            color: "white",
            backgroundColor: "#2164DA",
            borderRadius: "0 0 0 6px",
          }}
        >
          {label}
        </div>
      )}
    </div>
  )
}
