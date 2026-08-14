interface BlockHighlightOverlayProps {
  top: number
  left: number
  width: number
  height: number
  label?: string
}

export const BlockHighlightOverlay = ({
  top,
  left,
  width,
  height,
  label,
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
