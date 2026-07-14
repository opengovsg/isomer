import type { Editor as TiptapEditor } from "@tiptap/react"
import type { RefObject } from "react"
import { Box, Text, Textarea } from "@chakra-ui/react"
import { useEffect, useLayoutEffect, useRef, useState } from "react"

const CAPTION_MAX_LENGTH = 200
const CAPTION_NEAR_LIMIT_THRESHOLD = 20
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
  const isNearLimit =
    length >= CAPTION_MAX_LENGTH - CAPTION_NEAR_LIMIT_THRESHOLD

  return (
    <Text
      as="span"
      fontSize="xs"
      color={
        isAtLimit
          ? "utility.feedback.critical"
          : isNearLimit
            ? "utility.feedback.warning"
            : "base.content.medium"
      }
      fontWeight={isAtLimit ? "semibold" : "normal"}
    >
      {length}/{CAPTION_MAX_LENGTH}
    </Text>
  )
}

interface SingleTableCaptionProps {
  editor: TiptapEditor
  pos: number
  caption: string
}

/**
 * Click-to-edit caption line for a single table instance, scoped to `pos`.
 * Renders a quiet (italic when empty) text line; clicking swaps in an
 * editable textarea. Blur or Enter commits, Escape cancels. A character
 * counter is shown only while editing, turning amber near the limit and red
 * at the limit.
 */
const SingleTableCaption = ({
  editor,
  pos,
  caption,
}: SingleTableCaptionProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(caption)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isEditing) {
      setDraft(caption)
      // Focus after the textarea mounts.
      requestAnimationFrame(() => inputRef.current?.focus())
    }
    // Only re-sync the draft when entering edit mode, not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing])

  const commit = () => {
    setTableCaptionAtPos(editor, pos, draft)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <Box>
        <Textarea
          ref={inputRef}
          value={draft}
          onChange={(e) =>
            setDraft(e.target.value.slice(0, CAPTION_MAX_LENGTH))
          }
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setIsEditing(false)
            }
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              commit()
            }
          }}
          placeholder={CAPTION_PLACEHOLDER}
          size="sm"
          rows={2}
          resize="vertical"
          bg="base.canvas.default"
        />
        <Box textAlign="right" mt="0.25rem">
          <CounterText length={draft.length} />
        </Box>
      </Box>
    )
  }

  return (
    <Text
      role="button"
      tabIndex={0}
      aria-label={caption ? `Edit table caption: ${caption}` : "Add a caption"}
      onClick={() => setIsEditing(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter") setIsEditing(true)
      }}
      px="0.25rem"
      py="0.125rem"
      borderRadius="0.25rem"
      cursor="text"
      fontStyle={caption ? "normal" : "italic"}
      color={caption ? "base.content.strong" : "base.content.medium"}
      _hover={{ bg: "interaction.muted.main.hover" }}
    >
      {caption || CAPTION_PLACEHOLDER}
    </Text>
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
  const [rect, setRect] = useState<{ top: number; left: number } | null>(null)
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
      setRect({
        top:
          tableRect.top -
          containerRect.top +
          container.scrollTop -
          captionHeight -
          CAPTION_TABLE_GAP_PX,
        left: tableRect.left - containerRect.left + container.scrollLeft,
      })
    }

    measure()
    editor.on("transaction", measure)
    return () => {
      editor.off("transaction", measure)
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
      zIndex="1"
    >
      <SingleTableCaption editor={editor} pos={pos} caption={caption} />
    </Box>
  )
}

/**
 * Renders one inline, click-to-edit caption above EACH `table` node in the
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
