export type DiffHighlightKind = "added" | "removed" | "modified"

export interface DiffHighlight {
  route: number[]
  kind: DiffHighlightKind
}

const STYLE_ELEMENT_ID = "isomer-diff-highlight-styles"

const HIGHLIGHT_CSS = `
.isomer-diff-highlight { position: relative; }
.isomer-diff-highlight--added { background-color: rgba(37, 99, 235, 0.18) !important; }
.isomer-diff-highlight--removed { background-color: rgba(217, 119, 6, 0.18) !important; }
.isomer-diff-highlight--modified { background-color: rgba(124, 58, 237, 0.18) !important; }
.isomer-diff-badge {
  position: absolute;
  top: -0.5rem;
  left: -0.5rem;
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  line-height: 1;
  color: #fff;
  z-index: 2147483647;
  pointer-events: none;
  font-family: sans-serif;
}
.isomer-diff-badge--added { background-color: #2563eb; }
.isomer-diff-badge--removed { background-color: #d97706; }
.isomer-diff-badge--modified { background-color: #7c3aed; }
body.isomer-diff-hidden .isomer-diff-highlight { background-color: transparent !important; }
body.isomer-diff-hidden .isomer-diff-badge { display: none; }
`

const BADGE_TEXT: Record<DiffHighlightKind, string> = {
  added: "+",
  removed: "−",
  modified: "~",
}

/**
 * Walks a diffDOM `route` (an array of childNodes indices from `root`
 * downward) and returns the node it points to, or null if any step is
 * out of bounds.
 */
export function resolveRoute(root: Node, route: number[]): Node | null {
  let current: Node = root
  for (const index of route) {
    const next = current.childNodes[index]
    if (!next) return null
    current = next
  }
  return current
}

function toHighlightableElement(node: Node | null): HTMLElement | null {
  if (!node) return null
  if (node.nodeType === Node.ELEMENT_NODE) return node as HTMLElement
  return node.parentElement
}

function ensureHighlightStylesInjected(doc: Document): void {
  if (doc.getElementById(STYLE_ELEMENT_ID)) return
  const style = doc.createElement("style")
  style.id = STYLE_ELEMENT_ID
  style.textContent = HIGHLIGHT_CSS
  doc.head.appendChild(style)
}

/**
 * Resolves each highlight's route against `doc.body` and injects a
 * highlight class + badge at that node. Routes that don't resolve to an
 * actual node are silently skipped rather than thrown — one bad route
 * should never take down the rest of the diff view.
 */
export function applyDiffHighlights(
  doc: Document,
  highlights: DiffHighlight[],
): void {
  ensureHighlightStylesInjected(doc)

  for (const { route, kind } of highlights) {
    const node = resolveRoute(doc.body, route)
    const element = toHighlightableElement(node)
    if (!element) continue

    element.classList.add(
      "isomer-diff-highlight",
      `isomer-diff-highlight--${kind}`,
    )

    const badge = doc.createElement("span")
    badge.className = `isomer-diff-badge isomer-diff-badge--${kind}`
    badge.textContent = BADGE_TEXT[kind]
    element.insertBefore(badge, element.firstChild)
  }
}

/** Shows/hides every highlight+badge injected by `applyDiffHighlights` without recomputing anything. */
export function setHighlightsVisible(doc: Document, visible: boolean): void {
  doc.body.classList.toggle("isomer-diff-hidden", !visible)
}
