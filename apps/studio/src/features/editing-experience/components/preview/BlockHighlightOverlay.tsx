import { useToken } from "@chakra-ui/react"
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
  const [outlineColor, overlayBgColor, labelColor] = useToken("colors", [
    "interaction.main.default",
    "interaction.tinted.main.active",
    "base.content.inverse",
  ])
  const [spacing2px, spacing8px] = useToken("space", ["0.5", "2"])
  const [labelBorderRadius] = useToken("radii", ["md"])
  const [labelFontSize] = useToken("fontSizes", ["xs"])
  const [labelLineHeight] = useToken("lineHeights", ["base"])

  return (
    <div
      style={{
        position: "absolute",
        top,
        left,
        width,
        height,
        outline: `${spacing2px} solid ${outlineColor}`,
        outlineOffset: spacing2px,
        backgroundColor: overlayBgColor,
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
            padding: `${spacing2px} ${spacing8px}`,
            fontSize: labelFontSize,
            lineHeight: labelLineHeight,
            color: labelColor,
            backgroundColor: outlineColor,
            borderRadius: `0 0 0 ${labelBorderRadius}`,
          }}
        >
          {label}
        </div>
      )}
    </div>
  )
}
