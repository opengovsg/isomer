import { DiffDOM } from "diff-dom"
import { useEffect, useState } from "react"

import type { DiffHighlight, DiffHighlightKind } from "./applyDiffHighlights"
import { applyDiffHighlights } from "./applyDiffHighlights"

export type DomDiffStatus = "pending" | "ready" | "error"

interface UseDomDiffParams {
  beforeDocument: Document | null
  afterDocument: Document | null
}

interface UseDomDiffResult {
  status: DomDiffStatus
}

// diff-dom operations whose route only resolves in the "before" tree (the
// node no longer exists after the change).
const REMOVAL_ACTIONS = new Set([
  "removeElement",
  "removeTextElement",
  "removeAttribute",
])

// Operations whose route only resolves in the "after" tree (the node
// didn't exist before the change).
const ADDITION_ACTIONS = new Set([
  "addElement",
  "addTextElement",
  "addAttribute",
])

// Everything else (modifyTextElement, modifyAttribute, replaceElement,
// relocateGroup, modifyValue, modifyChecked, modifySelected,
// modifyComment) describes a node present at the same route in both
// trees, just changed — highlighted as "modified" in both panes. This
// intentionally does not attempt semantic move detection (e.g.
// relocateGroup) beyond marking the affected route "modified" — this is
// an accepted limitation, not a bug to fix.
function classify(action: string): DiffHighlightKind | "both-modified" {
  if (REMOVAL_ACTIONS.has(action)) return "removed"
  if (ADDITION_ACTIONS.has(action)) return "added"
  return "both-modified"
}

interface DiffDomOperation {
  action: string
  route?: number[]
}

export function useDomDiff({
  beforeDocument,
  afterDocument,
}: UseDomDiffParams): UseDomDiffResult {
  const [status, setStatus] = useState<DomDiffStatus>("pending")

  // This effect only recomputes when the `beforeDocument`/`afterDocument`
  // object *references* change (per the dependency array below) — it does
  // NOT observe in-place mutations of a document's content. That's fine
  // today because every caller (via `PreviewIframe`'s mount callback) hands
  // over fully-resolved static content synchronously, before the Document
  // reference is exposed to this hook. If a future caller instead streamed
  // or incrementally updated content into an already-mounted iframe, this
  // hook would silently diff against stale content, since no new Document
  // reference would arrive to re-trigger the effect.
  useEffect(() => {
    if (!beforeDocument?.body || !afterDocument?.body) return

    try {
      const dd = new DiffDOM()
      const operations = dd.diff(
        beforeDocument.body,
        afterDocument.body,
      ) as unknown as DiffDomOperation[]

      const beforeHighlights: DiffHighlight[] = []
      const afterHighlights: DiffHighlight[] = []

      for (const op of operations) {
        if (!Array.isArray(op.route)) continue

        const kind = classify(op.action)
        if (kind === "removed") {
          beforeHighlights.push({ route: op.route, kind: "removed" })
        } else if (kind === "added") {
          afterHighlights.push({ route: op.route, kind: "added" })
        } else {
          beforeHighlights.push({ route: op.route, kind: "modified" })
          afterHighlights.push({ route: op.route, kind: "modified" })
        }
      }

      applyDiffHighlights(beforeDocument, beforeHighlights)
      applyDiffHighlights(afterDocument, afterHighlights)
      setStatus("ready")
    } catch (error) {
      console.error("Failed to compute page diff", error)
      setStatus("error")
    }
  }, [beforeDocument, afterDocument])

  return { status }
}
