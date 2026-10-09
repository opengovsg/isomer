import type { CSSProperties } from "react"
import { useToken } from "@chakra-ui/react"
import { BiChevronDown, BiChevronUp, BiPencil } from "react-icons/bi"
import { BLOCK_FLASH_FADE_DURATION_MS } from "~/features/editing-experience/hooks/useBlockFlashHighlight"

const PILL_HEIGHT = "20px"

interface BlockHighlightOverlayProps {
  top: number
  left: number
  width: number
  height: number
  label?: string
  isFading?: boolean
  onEditClick?: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  canMoveUp?: boolean
  canMoveDown?: boolean
}

export const BlockHighlightOverlay = ({
  top,
  left,
  width,
  height,
  label,
  isFading = false,
  onEditClick,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
}: BlockHighlightOverlayProps): JSX.Element => {
  const [
    outlineColor,
    overlayBgColor,
    labelColor,
    canvasColor,
    disabledContentColor,
  ] = useToken("colors", [
    "interaction.main.default",
    "interaction.tinted.main.active",
    "base.content.inverse",
    "base.canvas.default",
    "interaction.support.disabled-content",
  ])
  const [spacing2px, spacing8px] = useToken("space", ["0.5", "2"])
  const [labelBorderRadius] = useToken("radii", ["md"])
  const [labelFontSize] = useToken("fontSizes", ["xs"])
  const [labelLineHeight] = useToken("lineHeights", ["base"])

  const showMove = onMoveUp !== undefined && onMoveDown !== undefined
  const hasActions = onEditClick !== undefined || showMove
  const leftRadius = `0 0 0 ${labelBorderRadius}`
  const rightRadius = `0 0 ${labelBorderRadius} 0`

  const actionButtonStyle = (
    disabled: boolean,
    borderRadius: string,
    overlapPrevious: boolean,
  ): CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: "4px",
    height: PILL_HEIGHT,
    boxSizing: "border-box",
    marginLeft: overlapPrevious ? "-1px" : undefined,
    padding: `0 ${spacing8px}`,
    fontSize: labelFontSize,
    lineHeight: labelLineHeight,
    color: disabled ? disabledContentColor : outlineColor,
    backgroundColor: canvasColor,
    border: `1px solid ${disabled ? disabledContentColor : outlineColor}`,
    borderRadius,
    cursor: disabled ? "not-allowed" : "pointer",
  })

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
      {(label ?? hasActions) && (
        <div
          data-isomer-preview-toolbar
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            display: "flex",
            alignItems: "stretch",
            height: PILL_HEIGHT,
            pointerEvents: hasActions ? "auto" : "none",
          }}
        >
          {showMove && (
            <>
              <button
                type="button"
                aria-label="Move block up"
                title={canMoveUp ? "Move block up" : "This block can't move up"}
                disabled={!canMoveUp}
                onClick={(event) => {
                  event.stopPropagation()
                  onMoveUp()
                }}
                style={actionButtonStyle(!canMoveUp, leftRadius, false)}
              >
                <BiChevronUp size={12} />
                Up
              </button>
              <button
                type="button"
                aria-label="Move block down"
                title={
                  canMoveDown ? "Move block down" : "This block can't move down"
                }
                disabled={!canMoveDown}
                onClick={(event) => {
                  event.stopPropagation()
                  onMoveDown()
                }}
                style={actionButtonStyle(!canMoveDown, "0", true)}
              >
                <BiChevronDown size={12} />
                Down
              </button>
            </>
          )}
          {onEditClick && (
            <button
              type="button"
              onClick={onEditClick}
              style={actionButtonStyle(
                false,
                showMove ? "0" : leftRadius,
                showMove,
              )}
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
                borderRadius: hasActions ? rightRadius : leftRadius,
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
