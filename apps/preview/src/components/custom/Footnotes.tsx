import { useState, useEffect, useRef } from "react"

interface FootnoteEntry {
  sup: string
  text: string
}

const FOOTNOTES: Record<string, FootnoteEntry> = {
  mitochondria: {
    sup: "1",
    text: "Powerhouse of the cell.",
  },
  grants: {
    sup: "terms",
    text: "This is only applicable to Singaporeans and Permanent Residents.",
  },
  "complex operations": {
    sup: "?",
    text: "Such as making sure everyone gets their grant.",
  },
}

function FootnoteWord({
  id,
  onOpen,
}: {
  id: string
  onOpen: (id: string, rect: DOMRect) => void
}) {
  const fn = FOOTNOTES[id]
  const ref = useRef<HTMLSpanElement>(null)

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (ref.current) onOpen(id, ref.current.getBoundingClientRect())
  }

  return (
    <span
      ref={ref}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === "Enter" && ref.current?.click()}
      style={{
        textDecoration: "underline",
        textDecorationStyle: "dotted",
        textUnderlineOffset: 3,
        cursor: "pointer",
        display: "inline",
        whiteSpace: "nowrap",
      }}
    >
      {id}
      <sup style={{ fontSize: "0.65em", fontWeight: 700, marginLeft: 1 }}>
        {fn.sup}
      </sup>
    </span>
  )
}

interface PopoverState {
  id: string
  rect: DOMRect
}

export default function Footnotes() {
  const [popover, setPopover] = useState<PopoverState | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  function openPopover(id: string, rect: DOMRect) {
    setPopover((prev) => (prev?.id === id ? null : { id, rect }))
  }

  useEffect(() => {
    if (!popover) return
    function handleOutsideClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopover(null)
      }
    }
    document.addEventListener("mousedown", handleOutsideClick)
    return () => document.removeEventListener("mousedown", handleOutsideClick)
  }, [popover])

  const activeEntry = popover ? FOOTNOTES[popover.id] : null

  // Position popover below the word, clamped to viewport
  const popoverStyle: React.CSSProperties = popover
    ? {
        position: "fixed",
        top: popover.rect.bottom + 8,
        left: Math.max(8, Math.min(popover.rect.left, (typeof window !== "undefined" ? window.innerWidth : 800) - 312)),
        width: 304,
        zIndex: 9999,
      }
    : { display: "none" }

  return (
    <section className="my-6">
      <p className="prose-body-base text-base-content">
        The cellular biology of economic transformation reveals that the{" "}
        <FootnoteWord id="mitochondria" onOpen={openPopover} />{" "}
        converts nutrients into usable energy through a process remarkably similar to how enterprise{" "}
        <FootnoteWord id="grants" onOpen={openPopover} />{" "}
        convert government funding into productive business capacity—enabling organisms and organisations alike to sustain{" "}
        <FootnoteWord id="complex operations" onOpen={openPopover} />,{" "}
        adapt to environmental pressures, and generate the metabolic surplus necessary for long-term growth across diverse conditions.
      </p>

      {/* Popover */}
      <div ref={popoverRef} style={popoverStyle}>
        {activeEntry && (
          <div
            style={{
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
              padding: "12px 14px 12px 16px",
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
            }}
          >
            <p className="prose-body-base text-base-content" style={{ margin: 0, flex: 1 }}>
              <sup style={{ fontSize: "0.65em", fontWeight: 700, marginRight: 4 }}>
                {activeEntry.sup}
              </sup>
              {activeEntry.text}
            </p>
            <button
              aria-label="Dismiss footnote"
              onClick={() => setPopover(null)}
              style={{
                flexShrink: 0,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#9ca3af",
                padding: 0,
                lineHeight: 1,
                fontSize: 16,
                marginTop: 1,
              }}
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
