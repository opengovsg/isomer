import { useState, useEffect, useRef, useContext } from "react"
import { BlockConfigContext } from "../BlockConfigContext"

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

const FOOTNOTE_KEYS = Object.keys(FOOTNOTES)

function FootnoteWord({
  id,
  activeId,
  onOpen,
}: {
  id: string
  activeId: string | null
  onOpen: (id: string, rect: DOMRect) => void
}) {
  const fn = FOOTNOTES[id]
  const ref = useRef<HTMLSpanElement>(null)
  const isActive = activeId === id
  const isDimmed = activeId !== null && !isActive

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
        opacity: isDimmed ? 0.8 : 1,
        transition: "opacity 0.15s ease",
      }}
    >
      {id}
      <sup style={{ fontSize: "0.65em", fontWeight: 700, marginLeft: 1 }}>
        {fn.sup}
      </sup>
    </span>
  )
}

// ── Popover variant ────────────────────────────────────────────────────────

interface PopoverState {
  id: string
  rect: DOMRect
}

function PopoverVariant() {
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

  const popoverStyle: React.CSSProperties = popover
    ? {
        position: "fixed",
        top: popover.rect.bottom + 8,
        left: Math.max(
          8,
          Math.min(
            popover.rect.left,
            (typeof window !== "undefined" ? window.innerWidth : 800) - 312,
          ),
        ),
        width: 304,
        zIndex: 9999,
      }
    : { display: "none" }

  return (
    <>
      <p className="prose-body-base text-base-content">
        <FootnoteText activeId={popover?.id ?? null} onOpen={openPopover} />
      </p>
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
    </>
  )
}

// ── Sheet variant ──────────────────────────────────────────────────────────

function SheetVariant() {
  const [activeId, setActiveId] = useState<string | null>(null)

  function openSheet(id: string) {
    setActiveId((prev) => (prev === id ? null : id))
  }

  function handleOpen(id: string, _rect: DOMRect) {
    openSheet(id)
  }

  useEffect(() => {
    if (!activeId) return
    function handleOutsideClick(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (!target.closest("[data-sheet]") && !target.closest("[data-footnote-word]")) {
        setActiveId(null)
      }
    }
    document.addEventListener("mousedown", handleOutsideClick)
    return () => document.removeEventListener("mousedown", handleOutsideClick)
  }, [activeId])

  const activeEntry = activeId ? FOOTNOTES[activeId] : null
  const isOpen = !!activeId

  return (
    <>
      <p className="prose-body-base text-base-content">
        <FootnoteText activeId={activeId} onOpen={handleOpen} isSheet />
      </p>

      {/* Mobile: bottom sheet */}
      <div
        data-sheet
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          transform: isOpen ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.25s ease",
          background: "white",
          borderRadius: "12px 12px 0 0",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.14)",
          maxHeight: "50vh",
          overflowY: "auto",
          display: "block",
        }}
        className="md:hidden"
      >
        <div style={{ padding: "16px 20px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span
              className="prose-label-sm text-base-content"
              style={{ color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: 11 }}
            >
              Footnote
            </span>
            <button
              aria-label="Close"
              onClick={() => setActiveId(null)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: 18, padding: 0, lineHeight: 1 }}
            >
              ✕
            </button>
          </div>
          {activeEntry && (
            <p className="prose-body-base text-base-content" style={{ margin: 0 }}>
              <sup style={{ fontSize: "0.65em", fontWeight: 700, marginRight: 4 }}>{activeEntry.sup}</sup>
              {activeEntry.text}
            </p>
          )}
        </div>
      </div>

      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="md:hidden"
          onClick={() => setActiveId(null)}
          style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.2)" }}
        />
      )}

      {/* Desktop: right panel */}
      <div
        data-sheet
        className="hidden md:block"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: 320,
          zIndex: 9999,
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.25s ease",
          background: "white",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
          overflowY: "auto",
        }}
      >
        <div style={{ padding: "24px 24px 32px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <span
              style={{ color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: 11, fontWeight: 600 }}
            >
              Footnote
            </span>
            <button
              aria-label="Close"
              onClick={() => setActiveId(null)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: 18, padding: 0, lineHeight: 1 }}
            >
              ✕
            </button>
          </div>
          {activeEntry && (
            <p className="prose-body-base text-base-content" style={{ margin: 0 }}>
              <sup style={{ fontSize: "0.65em", fontWeight: 700, marginRight: 4 }}>{activeEntry.sup}</sup>
              {activeEntry.text}
            </p>
          )}
          <div style={{ marginTop: 24, borderTop: "1px solid #f3f4f6", paddingTop: 16 }}>
            <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>Other footnotes</p>
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
              {FOOTNOTE_KEYS.filter((k) => k !== activeId).map((k) => (
                <button
                  key={k}
                  onClick={() => setActiveId(k)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    padding: "8px 10px",
                    borderRadius: 6,
                    background: "#f9fafb",
                  } as React.CSSProperties}
                >
                  <p className="prose-body-sm text-base-content" style={{ margin: 0 }}>
                    <sup style={{ fontSize: "0.65em", fontWeight: 700, marginRight: 4 }}>{FOOTNOTES[k].sup}</sup>
                    {FOOTNOTES[k].text}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Shared paragraph ───────────────────────────────────────────────────────

function FootnoteText({
  activeId,
  onOpen,
  isSheet,
}: {
  activeId: string | null
  onOpen: (id: string, rect: DOMRect) => void
  isSheet?: boolean
}) {
  return (
    <>
      The cellular biology of economic transformation reveals that the{" "}
      <span data-footnote-word>
        <FootnoteWord id="mitochondria" activeId={activeId} onOpen={onOpen} />
      </span>{" "}
      converts nutrients into usable energy through a process remarkably similar to how enterprise{" "}
      <span data-footnote-word>
        <FootnoteWord id="grants" activeId={activeId} onOpen={onOpen} />
      </span>{" "}
      convert government funding into productive business capacity—enabling organisms and organisations alike to sustain{" "}
      <span data-footnote-word>
        <FootnoteWord id="complex operations" activeId={activeId} onOpen={onOpen} />
      </span>
      ,{" "}
      adapt to environmental pressures, and generate the metabolic surplus necessary for long-term growth across diverse conditions.
    </>
  )
}

// ── Root ───────────────────────────────────────────────────────────────────

export default function Footnotes() {
  const { configs } = useContext(BlockConfigContext)
  const variant = configs["footnotes"]?.variant ?? "popover"

  return (
    <section className="my-6">
      {variant === "sheet" ? <SheetVariant /> : <PopoverVariant />}
    </section>
  )
}
