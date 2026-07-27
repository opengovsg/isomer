import type { Editor as TiptapEditor } from "@tiptap/react"
import type { RefObject } from "react"
import { Box, Flex, Icon, Text, useDisclosure } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { useEditorState } from "@tiptap/react"
import { useLayoutEffect, useRef, useState } from "react"
import { BiPencil } from "react-icons/bi"
import { TableSettingsModal } from "~/components/PageEditor/TableSettingsModal"

import {
  CAPTION_TABLE_GAP_PX,
  captionRectsEqual,
  computeCaptionLayout,
  getDisplayTableCaption,
  getTableInstances,
  isPlaceholderTableCaption,
  type CaptionLayoutRect,
} from "./utils"

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

interface SingleTableCaptionProps {
  caption: string
  onEdit: () => void
}

/**
 * Read-only caption line for a single table instance with a right-aligned
 * control that opens the table settings modal — "Add caption" for placeholder
 * defaults, "Edit" when a real caption exists.
 */
const SingleTableCaption = ({ caption, onEdit }: SingleTableCaptionProps) => {
  const hasCaption = !isPlaceholderTableCaption(caption)
  const displayCaption = getDisplayTableCaption(caption)
  const label = hasCaption ? "Edit" : "Add caption"

  return (
    <Flex align="center" justify="space-between" gap="0.25rem" w="100%">
      <Text
        flex="1"
        minW={0}
        textStyle="caption-2"
        color={hasCaption ? "base.content.default" : "base.content.medium"}
        whiteSpace="normal"
        wordBreak="break-word"
      >
        {displayCaption}
      </Text>
      <Button
        variant="clear"
        size="xs"
        leftIcon={
          <Icon
            as={BiPencil}
            color="interaction.links.default"
            boxSize="1rem"
          />
        }
        color="interaction.links.default"
        textStyle="caption-1"
        padding="0.5rem"
        flexShrink={0}
        onClick={onEdit}
        aria-label={hasCaption ? "Edit table caption" : "Add table caption"}
      >
        {label}
      </Button>
    </Flex>
  )
}

interface TableCaptionSlotProps extends SingleTableCaptionProps {
  editor: TiptapEditor
  pos: number
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
 * Caption `top` is the table's margin-edge (border-box top minus the margin
 * currently on the table), not `borderBoxTop - newMargin`. That keeps the
 * caption line stable when the caption box grows/shrinks instead of jumping
 * the whole caption up and later dropping it into the table on blur.
 *
 * Measurement happens in `useLayoutEffect`, not inline during render — doing
 * it in a plain `useMemo`/render body can capture an all-zero rect if the
 * browser hasn't flushed layout yet, and (since deps may not change again)
 * that zero rect would never get recomputed. Re-measuring runs on every
 * editor transaction so a caption stays correctly positioned and sized as
 * rows/columns are added, removed, or reordered, or as the caption wraps
 * to more/fewer lines.
 *
 * `rect` stays as React state: it is DOM layout measurement, not editor JSON.
 */
const TableCaptionSlot = ({
  editor,
  pos,
  caption,
  containerRef,
  onEdit,
}: TableCaptionSlotProps) => {
  const [rect, setRect] = useState<CaptionLayoutRect | null>(null)
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

      const captionHeight = captionRef.current?.offsetHeight ?? 0
      const currentMarginTop = Number.parseFloat(tableDom.style.marginTop) || 0
      const { rect: next, marginTop } = computeCaptionLayout({
        tableRect: tableDom.getBoundingClientRect(),
        containerRect: container.getBoundingClientRect(),
        scrollTop: container.scrollTop,
        scrollLeft: container.scrollLeft,
        captionHeight,
        currentMarginTop,
        gapPx: CAPTION_TABLE_GAP_PX,
      })
      tableDom.style.marginTop = `${marginTop}px`

      setRect((prev) => (captionRectsEqual(prev, next) ? prev : next))
    }

    measure()
    editor.on("transaction", measure)

    const resizeObserver = new ResizeObserver(measure)
    if (captionRef.current) {
      resizeObserver.observe(captionRef.current)
    }

    return () => {
      editor.off("transaction", measure)
      resizeObserver.disconnect()
      tableDom.style.marginTop = previousMarginTop
    }
  }, [editor, pos, containerRef, caption])

  return (
    <Box
      ref={captionRef}
      position="absolute"
      visibility={rect ? "visible" : "hidden"}
      top={`${rect?.top ?? 0}px`}
      left={`${rect?.left ?? 0}px`}
      width={rect ? `${rect.width}px` : undefined}
      zIndex="1"
    >
      <SingleTableCaption caption={caption} onEdit={onEdit} />
    </Box>
  )
}

interface TableCaptionReadyProps {
  editor: TiptapEditor
  containerRef: RefObject<HTMLElement>
}

/**
 * Inner body that only mounts once `editor` is non-null. TipTap's
 * `useEditorState` builds its snapshot manager with the initial `editor`
 * value and does not refresh that snapshot when `editor` later changes
 * from `null` → ready (it only bumps on transactions). Mounting this
 * subtree deliberately avoids that stale-null snapshot.
 */
const TableCaptionReady = ({
  editor,
  containerRef,
}: TableCaptionReadyProps) => {
  const {
    isOpen: isTableSettingsModalOpen,
    onOpen: onTableSettingsModalOpen,
    onClose: onTableSettingsModalClose,
  } = useDisclosure()
  const [activeTablePos, setActiveTablePos] = useState<number | null>(null)

  const { tables } = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => ({
      tables: getTableInstances(currentEditor),
      doc: currentEditor.state.doc,
    }),
    equalityFn: (previous, next) => next !== null && previous.doc === next.doc,
  })

  const openTableSettings = (pos: number) => {
    setActiveTablePos(pos)
    onTableSettingsModalOpen()
  }

  return (
    <>
      {tables.map((table) => (
        <TableCaptionSlot
          key={table.pos}
          editor={editor}
          pos={table.pos}
          caption={table.caption}
          containerRef={containerRef}
          onEdit={() => openTableSettings(table.pos)}
        />
      ))}
      {activeTablePos !== null && (
        <TableSettingsModal
          editor={editor}
          tablePos={activeTablePos}
          isOpen={isTableSettingsModalOpen}
          onClose={onTableSettingsModalClose}
        />
      )}
    </>
  )
}

/**
 * Renders one caption control above EACH `table` node in the editor's
 * document — not just the first. Each caption's position is re-derived from
 * the live document on every transaction (so it stays correct as tables are
 * inserted, removed, or reordered), and every read/write is scoped to that
 * specific table's document position rather than "the table at the current
 * selection".
 *
 * Must be rendered as a child of `containerRef`'s element (or otherwise
 * absolutely positioned relative to it), since captions are positioned
 * absolutely against that container's bounding box.
 */
export const TableCaption = ({ editor, containerRef }: TableCaptionProps) => {
  if (!editor) return null
  return <TableCaptionReady editor={editor} containerRef={containerRef} />
}
