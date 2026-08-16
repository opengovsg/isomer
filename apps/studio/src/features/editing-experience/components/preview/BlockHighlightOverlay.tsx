import { useToken } from "@chakra-ui/react"
import { BiPencil } from "react-icons/bi"
import { BLOCK_FLASH_FADE_DURATION_MS } from "~/features/editing-experience/hooks/useBlockFlashHighlight"

const PILL_HEIGHT = "20px"

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
  // Renders an "Edit" button beside the label. Sits inside the box's
  // top-right corner (rather than fully outside it) since the hover overlay
  // only stays mounted while the cursor stays within the block's own DOM
  // bounds — anything positioned outside that area would cause a
  // `mouseout` the moment the cursor reaches it, clearing the highlight
  // (and the button) before it could be clicked. Accepted trade-off: this
  // can shadow a sliver of the block's own interactive content in that corner.
  onEditClick?: () => void
}

export const BlockHighlightOverlay = ({
  top,
  left,
  width,
  height,
  label,
  isFading = false,
  onEditClick,
}: BlockHighlightOverlayProps): JSX.Element => {
  const [outlineColor, overlayBgColor, labelColor, canvasColor] = useToken(
    "colors",
    [
      "interaction.main.default",
      "interaction.tinted.main.active",
      "base.content.inverse",
      "base.canvas.default",
    ],
  )
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
      {(label ?? onEditClick) && (
        <div
          data-isomer-preview-toolbar
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            display: "flex",
            alignItems: "stretch",
            height: PILL_HEIGHT,
            pointerEvents: onEditClick ? "auto" : "none",
          }}
        >
          {onEditClick && (
            <button
              type="button"
              onClick={onEditClick}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                height: PILL_HEIGHT,
                boxSizing: "border-box",
                padding: `0 ${spacing8px}`,
                fontSize: labelFontSize,
                lineHeight: labelLineHeight,
                color: outlineColor,
                backgroundColor: canvasColor,
                border: `1px solid ${outlineColor}`,
                borderRadius: `0 0 0 ${labelBorderRadius}`,
                cursor: "pointer",
              }}
            >
              <BiPencil size={12} />
              Edit
            </button>
          )}
          {label && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                height: PILL_HEIGHT,
                padding: `0 ${spacing8px}`,
                fontSize: labelFontSize,
                lineHeight: labelLineHeight,
                color: labelColor,
                backgroundColor: outlineColor,
                borderRadius: onEditClick
                  ? `0 0 ${labelBorderRadius} 0`
                  : `0 0 0 ${labelBorderRadius}`,
              }}
            >
              {label}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
