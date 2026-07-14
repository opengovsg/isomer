import type { Editor as TiptapEditor } from "@tiptap/react"
import type { RefObject } from "react"
import { Box, Input, Text } from "@chakra-ui/react"
import { useEffect, useLayoutEffect, useRef, useState } from "react"

const CAPTION_MAX_LENGTH = 200
const CAPTION_PLACEHOLDER = "Add a caption..."

export interface TableCaptionProps {
  editor: TiptapEditor | null
  /**
   * The scrollable/positioned element that wraps the rendered editor
   * content (must be `position: relative` or similar), used as the
   * coordinate origin for each caption's absolute position. Pass a ref to
   * the element that directly wraps `EditorContent`.
   */
  containerRef: RefObject<HTMLElement>
}

interface TableInstance {
  /** ProseMirror document position of the `table` node. */
  pos: number
  caption: string
}

/**
 * Walks the document and returns the position + caption of every `table`
 * node, in document order. Scoping reads/writes to a specific table's `pos`
 * (rather than "whichever table is at the current selection") is what makes
 * this correct for documents containing more than one table.
 */
const getTableInstances = (editor: TiptapEditor): TableInstance[] => {
  const instances: TableInstance[] = []
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === "table") {
      instances.push({
        pos,
        caption: (node.attrs.caption as string | undefined) ?? "",
      })
      // Tables cannot be nested inside one another, so we don't need to
      // descend into this node's content to find more `table` nodes.
      return false
    }
    return true
  })
  return instances
}

/**
 * Writes `caption` onto the `table` node at `pos`, without touching the
 * editor's current selection. `editor.chain().updateAttributes('table', ...)`
 * is selection-scoped (it updates whichever table node the current selection
 * is inside), so it can't target an arbitrary table instance when a document
 * has more than one table. Instead we build a transaction directly with
 * `tr.setNodeMarkup`, which updates the node at an explicit document
 * position regardless of selection.
 */
const setTableCaptionAtPos = (
  editor: TiptapEditor,
  pos: number,
  caption: string,
): void => {
  const node = editor.state.doc.nodeAt(pos)
  if (!node || node.type.name !== "table") return

  const tr = editor.state.tr.setNodeMarkup(pos, undefined, {
    ...node.attrs,
    caption,
  })
  editor.view.dispatch(tr)
}

const CounterText = ({ length }: { length: number }) => {
  const isAtLimit = length >= CAPTION_MAX_LENGTH

  return (
    <Text
      as="span"
      fontSize="xs"
      color={
        isAtLimit ? "utility.feedback.critical" : "base.content.medium"
      }
      fontWeight={isAtLimit ? "semibold" : "normal"}
    >
      {length}/{CAPTION_MAX_LENGTH} characters
    </Text>
  )
}

interface SingleTableCaptionProps {
  editor: TiptapEditor
  pos: number
  caption: string
}

/**
 * Always-editable caption line for a single table instance, scoped to `pos`.
 * Renders a borderless single-line input styled as quiet caption text
 * (italic placeholder when empty). Writes to the table attribute on every
 * keystroke so the live preview stays in sync. Escape restores the caption
 * from when focus began; blur/Enter with an empty draft also restores that
 * baseline (empty captions are not persisted). A character counter is shown
 * only while focused. At the character limit the counter turns red.
 */
const SingleTableCaption = ({
  editor,
  pos,
  caption,
}: SingleTableCaptionProps) => {
  const [isFocused, setIsFocused] = useState(false)
  const [draft, setDraft] = useState(caption)
  const inputRef = useRef<HTMLInputElement>(null)
  const draftRef = useRef(draft)
  const baselineRef = useRef(caption)
  const isCancellingRef = useRef(false)

  draftRef.current = draft

  // Keep the visible value in sync with the document when not focused
  // (e.g. undo, or another path updating the caption attr).
  useEffect(() => {
    if (!isFocused) {
      setDraft(caption)
    }
  }, [caption, isFocused])

  const finish = (next: string) => {
    setTableCaptionAtPos(editor, pos, next)
    setDraft(next)
    setIsFocused(false)
  }

  return (
    <Box>
      <Input
        ref={inputRef}
        value={draft}
        onChange={(e) => {
          const value = e.target.value.slice(0, CAPTION_MAX_LENGTH)
          setDraft(value)
          // Live-write so the right-hand preview updates as the user types.
          setTableCaptionAtPos(editor, pos, value)
        }}
        onFocus={() => {
          baselineRef.current = caption
          setIsFocused(true)
        }}
        onBlur={() => {
          if (isCancellingRef.current) {
            isCancellingRef.current = false
            finish(baselineRef.current)
            return
          }
          const next = draftRef.current.trim()
          // Empty captions are not persisted — restore the value from focus.
          finish(next ? next : baselineRef.current)
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault()
            isCancellingRef.current = true
            inputRef.current?.blur()
            return
          }
          if (e.key === "Enter") {
            e.preventDefault()
            inputRef.current?.blur()
          }
        }}
        placeholder={CAPTION_PLACEHOLDER}
        aria-label={
          caption ? `Edit table caption: ${caption}` : "Add a caption"
        }
        variant="unstyled"
        size="sm"
        px="0.25rem"
        py="0.125rem"
        borderRadius="0.25rem"
        cursor="text"
        fontStyle={draft ? "normal" : "italic"}
        color={draft ? "base.content.strong" : "base.content.medium"}
        _placeholder={{
          fontStyle: "italic",
          color: "base.content.medium",
        }}
        _hover={{ bg: "interaction.muted.main.hover" }}
        _focus={{ bg: "interaction.muted.main.hover" }}
      />
      {isFocused && (
        <Box textAlign="right" mt="0.25rem">
          <CounterText length={draft.length} />
        </Box>
      )}
    </Box>
  )
}

interface TableCaptionSlotProps extends SingleTableCaptionProps {
  containerRef: RefObject<HTMLElement>
}

/**
 * Positions a single caption directly above its table's live DOM node.
 * `editor.view.nodeDOM(pos)` resolves a ProseMirror document position to the
 * actual rendered DOM element, which is what lets us anchor each caption to
 * the correct table instance on screen — rather than reparenting any DOM
 * node ProseMirror owns (which would fight React's reconciler), the caption
 * is rendered as a normal React child, absolutely positioned over the
 * measured rect.
 *
 * Absolute positioning alone isn't enough: nothing in the document reserves
 * vertical space above the table for the caption to occupy, so a caption
 * anchored via a negative offset/`translateY(-100%)` on a table that's the
 * first block in the document would render (and hit-test) outside the
 * container's own bounds. To avoid that, this also reserves the space by
 * setting `marginTop` directly on the table's DOM node (sized to the
 * caption's own measured height), imperatively — not through the shared
 * `IsomerTable` extension/CSS, so this stays scoped to this component and
 * doesn't affect tables anywhere else. The margin is restored on cleanup.
 *
 * Measurement happens in `useLayoutEffect`, not inline during render — doing
 * it in a plain `useMemo`/render body can capture an all-zero rect if the
 * browser hasn't flushed layout yet, and (since deps may not change again)
 * that zero rect would never get recomputed. Re-measuring runs on every
 * editor transaction so a caption stays correctly positioned and sized as
 * rows/columns are added, removed, or reordered, or as the caption itself
 * wraps to more/fewer lines.
 */
const CAPTION_TABLE_GAP_PX = 8

const TableCaptionSlot = ({
  editor,
  pos,
  caption,
  containerRef,
}: TableCaptionSlotProps) => {
  const [rect, setRect] = useState<{
    top: number
    left: number
    width: number
  } | null>(null)
  const captionRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const tableDom = editor.view.nodeDOM(pos)
    if (!(tableDom instanceof HTMLElement)) return

    const previousMarginTop = tableDom.style.marginTop

    const measure = () => {
      const container = containerRef.current
      if (!(tableDom instanceof HTMLElement) || !container) {
        setRect(null)
        return
      }

      // Reserve real layout space above the table for the caption, sized to
      // the caption's own rendered height, so the caption never has to be
      // positioned outside the container's bounds (e.g. when the table is
      // the first block in the document). The caption box below is always
      // mounted (just hidden until positioned), so it already has a real
      // height to read here even on this very first measurement.
      const captionHeight = captionRef.current?.offsetHeight ?? 0
      tableDom.style.marginTop = `${captionHeight + CAPTION_TABLE_GAP_PX}px`

      const tableRect = tableDom.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()
      const next = {
        top:
          tableRect.top -
          containerRect.top +
          container.scrollTop -
          captionHeight -
          CAPTION_TABLE_GAP_PX,
        left: tableRect.left - containerRect.left + container.scrollLeft,
        // Match table width so the always-visible input has a usable hit
        // target (especially when empty / placeholder-only).
        width: tableRect.width,
      }
      // Bail when nothing moved — otherwise ResizeObserver ↔ setRect can
      // feedback-loop (marginTop / position changes re-fire the observer).
      setRect((prev) =>
        prev &&
        prev.top === next.top &&
        prev.left === next.left &&
        prev.width === next.width
          ? prev
          : next,
      )
    }

    measure()
    editor.on("transaction", measure)

    // Re-measure when the caption box grows/shrinks (e.g. counter
    // appearing on focus), which does not emit an editor transaction.
    const resizeObserver = new ResizeObserver(measure)
    if (captionRef.current) {
      resizeObserver.observe(captionRef.current)
    }

    return () => {
      editor.off("transaction", measure)
      resizeObserver.disconnect()
      tableDom.style.marginTop = previousMarginTop
    }
  }, [editor, pos, containerRef])

  return (
    <Box
      ref={captionRef}
      position="absolute"
      // Always mounted (even before the first measurement completes) so
      // `captionRef.current?.offsetHeight` reflects the caption's real
      // rendered height as soon as `measure()` runs — if this were only
      // rendered once `rect` is known, the very first measurement could
      // never see a real height (the box wouldn't exist in the DOM yet),
      // which would under-reserve space above the table on first mount.
      // Hidden (rather than unmounted) until positioned, so it never
      // flashes at the wrong spot or intercepts a click at (0, 0).
      visibility={rect ? "visible" : "hidden"}
      top={`${rect?.top ?? 0}px`}
      left={`${rect?.left ?? 0}px`}
      width={rect ? `${rect.width}px` : undefined}
      zIndex="1"
    >
      <SingleTableCaption editor={editor} pos={pos} caption={caption} />
    </Box>
  )
}

/**
 * Renders one always-editable caption above EACH `table` node in the
 * editor's document — not just the first. Each caption's position is
 * re-derived from the live document on every transaction (so it stays
 * correct as tables are inserted, removed, or reordered), and every
 * read/write is scoped to that specific table's document position rather
 * than "the table at the current selection".
 *
 * Must be rendered as a child of `containerRef`'s element (or otherwise
 * absolutely positioned relative to it), since captions are positioned
 * absolutely against that container's bounding box.
 */
export const TableCaption = ({ editor, containerRef }: TableCaptionProps) => {
  const [tables, setTables] = useState<TableInstance[]>([])

  useEffect(() => {
    if (!editor) {
      setTables([])
      return
    }

    const sync = () => setTables(getTableInstances(editor))
    sync()

    editor.on("update", sync)
    editor.on("transaction", sync)
    return () => {
      editor.off("update", sync)
      editor.off("transaction", sync)
    }
  }, [editor])

  if (!editor) return null

  return (
    <>
      {tables.map((table) => (
        <TableCaptionSlot
          // A table's `pos` shifts when content earlier in the document
          // changes, but within a single transaction batch it uniquely
          // identifies one table instance, and `sync()` re-derives fresh
          // positions/captions on every transaction, so this never goes
          // stale across edits.
          key={table.pos}
          editor={editor}
          pos={table.pos}
          caption={table.caption}
          containerRef={containerRef}
        />
      ))}
    </>
  )
}
