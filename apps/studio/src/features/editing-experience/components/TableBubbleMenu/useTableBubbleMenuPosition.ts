import type { EditorState } from "@tiptap/pm/state"
import type { EditorView } from "@tiptap/pm/view"
import type { Editor } from "@tiptap/react"
import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
} from "@floating-ui/dom"
import { CellSelection, selectedRect } from "@tiptap/pm/tables"
import {
  useLayoutEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react"
import { flushSync } from "react-dom"

export interface TableBubbleMenuPosition {
  x: number
  y: number
}

export interface TableBubbleMenuPositions {
  trigger: TableBubbleMenuPosition | null
  actions: TableBubbleMenuPosition | null
}

const VIEWPORT_PADDING = 8
// Matches the 0.25rem gap that used to separate the list from the pencil.
const ACTIONS_GAP_PX = 4

const getEditorScrollParent = (view: EditorView): HTMLElement | Window => {
  let element: HTMLElement | null = view.dom.parentElement
  while (element) {
    const { overflowY } = getComputedStyle(element)
    if (overflowY === "auto" || overflowY === "scroll") {
      return element
    }
    element = element.parentElement
  }
  return window
}

const getBottomRightCellDocumentPos = (state: EditorState): number | null => {
  const { selection } = state
  if (!(selection instanceof CellSelection)) return null

  const rect = selectedRect(state)
  let bottomRightPos: number | null = null

  selection.forEachCell((node, pos) => {
    const cellRect = rect.map.findCell(pos - rect.tableStart)
    if (cellRect.right === rect.right && cellRect.bottom === rect.bottom) {
      bottomRightPos = pos
    }
  })

  return bottomRightPos
}

const getBottomRightCellRect = (
  view: EditorView,
  state: EditorState,
): DOMRect | null => {
  const cellPos = getBottomRightCellDocumentPos(state)
  if (cellPos === null) return null

  const dom = view.nodeDOM(cellPos)
  if (!(dom instanceof HTMLElement)) return null

  return dom.getBoundingClientRect()
}

interface TriggerPlacement extends TableBubbleMenuPosition {
  width: number
  height: number
}

// The pencil is centered on the selection's bottom-right corner. The actions
// list is positioned from this rect, so viewport shifting never moves the pencil.
const measureTrigger = (
  view: EditorView,
  state: EditorState,
  triggerEl: HTMLElement,
): TriggerPlacement | null => {
  const cell = getBottomRightCellRect(view, state)
  if (!cell) return null

  const width = triggerEl.offsetWidth
  const height = triggerEl.offsetHeight
  if (width === 0 || height === 0) return null

  return {
    x: Math.round(cell.right - width / 2),
    y: Math.round(cell.bottom - height / 2),
    width,
    height,
  }
}

const createPencilReference = (
  getPlacement: () => TriggerPlacement | null,
  contextElement: HTMLElement,
) => {
  const reference = {
    contextElement,
    getBoundingClientRect: () => {
      const placed = getPlacement()
      if (!placed) return new DOMRect()
      return new DOMRect(placed.x, placed.y, placed.width, placed.height)
    },
    getClientRects: () => [reference.getBoundingClientRect()],
  }

  return reference
}

const samePosition = (
  current: TableBubbleMenuPosition | null,
  next: TableBubbleMenuPosition,
) => current !== null && current.x === next.x && current.y === next.y

// autoUpdate does not track nested editor scroll containers.
const attachScrollListeners = (
  view: EditorView,
  onUpdate: () => void,
): (() => void) => {
  const scrollTarget = getEditorScrollParent(view)

  if (scrollTarget instanceof HTMLElement) {
    scrollTarget.addEventListener("scroll", onUpdate, { passive: true })
  }
  window.addEventListener("resize", onUpdate, { passive: true })

  return () => {
    if (scrollTarget instanceof HTMLElement) {
      scrollTarget.removeEventListener("scroll", onUpdate)
    }
    window.removeEventListener("resize", onUpdate)
  }
}

interface UseTableBubbleMenuPositionOptions {
  editor: Editor
  menuEl: HTMLDivElement | null
  actionsEl: HTMLDivElement | null
  show: boolean
  // Changes when the selection changes, which is the only time the pencil's
  // corner changes. Opening the actions list must not move the pencil.
  layoutKey: string
}

const commitPosition = (
  setPosition: Dispatch<SetStateAction<TableBubbleMenuPosition | null>>,
  next: TableBubbleMenuPosition | null,
  flush: boolean,
) => {
  const commit = () => {
    setPosition((current) => {
      if (next === null) return current === null ? current : null
      return samePosition(current, next) ? current : next
    })
  }
  // A setState during useLayoutEffect is already flushed before paint.
  // flushSync there warns and is ignored.
  if (flush) flushSync(commit)
  else commit()
}

export const useTableBubbleMenuPosition = ({
  editor,
  menuEl,
  actionsEl,
  show,
  layoutKey,
}: UseTableBubbleMenuPositionOptions): TableBubbleMenuPositions => {
  const editorRef = useRef(editor)
  editorRef.current = editor
  const layoutEffectDepth = useRef(0)

  const [trigger, setTrigger] = useState<TableBubbleMenuPosition | null>(null)
  const [actions, setActions] = useState<TableBubbleMenuPosition | null>(null)
  const [appliedLayoutKey, setAppliedLayoutKey] = useState(layoutKey)

  // Drop coordinates in this render when the selection changes, so the pencil
  // cannot paint on the previous corner.
  if (
    appliedLayoutKey !== layoutKey ||
    (!show && (trigger !== null || actions !== null))
  ) {
    setAppliedLayoutKey(layoutKey)
    setTrigger(null)
    setActions(null)
  }

  useLayoutEffect(() => {
    if (!show || !menuEl) {
      return
    }

    const triggerEl = menuEl.querySelector("[data-table-bubble-menu-trigger]")
    if (!(triggerEl instanceof HTMLElement)) return

    const getView = () => editorRef.current.view
    const getState = () => editorRef.current.state
    let requestId = 0
    let placement: TriggerPlacement | null = null

    const pencilReference = createPencilReference(() => placement, triggerEl)

    const update = () => {
      placement = measureTrigger(getView(), getState(), triggerEl)
      if (!placement) return

      commitPosition(
        setTrigger,
        { x: placement.x, y: placement.y },
        layoutEffectDepth.current === 0,
      )

      if (!actionsEl) {
        commitPosition(setActions, null, layoutEffectDepth.current === 0)
        return
      }

      const id = ++requestId
      void computePosition(pencilReference, actionsEl, {
        // Start alignment plus a cross-axis nudge parks the list to the right
        // of the pencil, so it does not cover the highlighted cells. Flip still
        // chooses above vs below.
        placement: "top-start",
        strategy: "fixed",
        middleware: [
          offset(({ rects }) => ({
            mainAxis: ACTIONS_GAP_PX,
            crossAxis: rects.reference.width + ACTIONS_GAP_PX,
          })),
          flip({
            fallbackPlacements: ["bottom-start"],
            padding: VIEWPORT_PADDING,
          }),
          // Keep the list on screen, but never slide it back over the pencil.
          // That would cover the highlighted cells again.
          shift({
            padding: VIEWPORT_PADDING,
            limiter: {
              fn: ({ x, y, rects }) => ({
                x: Math.max(
                  x,
                  rects.reference.x + rects.reference.width + ACTIONS_GAP_PX,
                ),
                y,
              }),
            },
          }),
        ],
      }).then(({ x, y }) => {
        if (id !== requestId) return
        commitPosition(setActions, { x: Math.round(x), y: Math.round(y) }, true)
      })
    }

    layoutEffectDepth.current += 1
    // autoUpdate calls update() once listeners are attached. Without an actions
    // element there is nothing for it to observe, so place the pencil directly.
    const stopAutoUpdate = actionsEl
      ? autoUpdate(pencilReference, actionsEl, update)
      : null
    if (!stopAutoUpdate) update()
    layoutEffectDepth.current -= 1

    const detachScrollListeners = attachScrollListeners(getView(), update)

    return () => {
      requestId += 1
      stopAutoUpdate?.()
      detachScrollListeners()
    }
  }, [show, menuEl, actionsEl, layoutKey])

  return { trigger, actions }
}
