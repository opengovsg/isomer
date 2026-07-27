import { Flex, Icon, Text, useDisclosure } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { BiPencil } from "react-icons/bi"
import { TableSettingsModal } from "~/components/PageEditor/TableSettingsModal"

import { getDisplayTableCaption, isPlaceholderTableCaption } from "./utils"

export interface TableCaptionProps {
  caption: string
  onCaptionChange: (caption: string) => void
}

/**
 * Read-only caption line for a single table with a right-aligned control that
 * opens the table settings modal — "Add caption" for placeholder defaults,
 * "Edit" when a real caption exists.
 *
 * Rendered by `TableNodeView`, so the caption it shows and the caption it
 * writes back always belong to the same `table` node — no document positions
 * to track, even when a document contains several tables.
 */
export const TableCaption = ({
  caption,
  onCaptionChange,
}: TableCaptionProps) => {
  const {
    isOpen: isTableSettingsModalOpen,
    onOpen: onTableSettingsModalOpen,
    onClose: onTableSettingsModalClose,
  } = useDisclosure()

<<<<<<< HEAD
  const hasCaption = !isPlaceholderTableCaption(caption)
  const displayCaption = getDisplayTableCaption(caption)
=======
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
          const value = clampCaptionLength(e.target.value)
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
          finish(resolveCaptionOnBlur(draftRef.current, baselineRef.current))
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
        <Box textAlign="left" mt="0.25rem">
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
 * Caption `top` is the table's margin-edge (border-box top minus the margin
 * currently on the table), not `borderBoxTop - newMargin`. That keeps the
 * input line stable when the caption box grows/shrinks — e.g. when the
 * character counter mounts on focus — instead of jumping the whole caption
 * up and later dropping it into the table on blur.
 *
 * Measurement happens in `useLayoutEffect`, not inline during render — doing
 * it in a plain `useMemo`/render body can capture an all-zero rect if the
 * browser hasn't flushed layout yet, and (since deps may not change again)
 * that zero rect would never get recomputed. Re-measuring runs on every
 * editor transaction so a caption stays correctly positioned and sized as
 * rows/columns are added, removed, or reordered, or as the caption itself
 * wraps to more/fewer lines.
 *
 * `rect` stays as React state: it is DOM layout measurement, not editor JSON.
 */
const TableCaptionSlot = ({
  editor,
  pos,
  caption,
  containerRef,
}: TableCaptionSlotProps) => {
  const [rect, setRect] = useState<CaptionLayoutRect | null>(null)
  const captionRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    let tableDom: HTMLElement | null = null
    let previousMarginTop = ""

    const measure = () => {
      const container = containerRef.current
      const nextTableDom = editor.view.nodeDOM(pos)
      if (!(nextTableDom instanceof HTMLElement) || !container) {
        setRect(null)
        return
      }

      if (tableDom !== nextTableDom) {
        if (tableDom) tableDom.style.marginTop = previousMarginTop
        tableDom = nextTableDom
        previousMarginTop = tableDom.style.marginTop
      }

      // Caption box is always mounted (just hidden until positioned), so it
      // already has a real height on the first measurement.
      const captionHeight = captionRef.current?.offsetHeight ?? 0
      // Peel off the margin we last wrote so the caption anchors to the
      // margin-edge origin. Using the *new* reserved height here instead
      // would jump the input up when the focus counter appears, and drop it
      // into the table when the counter disappears.
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

      // Bail when nothing moved — otherwise ResizeObserver ↔ setRect can
      // feedback-loop (marginTop / position changes re-fire the observer).
      setRect((prev) => (captionRectsEqual(prev, next) ? prev : next))
    }

    measure()
    // EditorContent mounts ProseMirror in its own effect, which can run after
    // this layout effect. Retry once after paint so nodeDOM(pos) is available.
    const raf = requestAnimationFrame(measure)
    editor.on("transaction", measure)

    // Re-measure when the caption box grows/shrinks (e.g. counter
    // appearing on focus), which does not emit an editor transaction.
    const resizeObserver = new ResizeObserver(measure)
    if (captionRef.current) {
      resizeObserver.observe(captionRef.current)
    }

    return () => {
      cancelAnimationFrame(raf)
      editor.off("transaction", measure)
      resizeObserver.disconnect()
      if (tableDom) tableDom.style.marginTop = previousMarginTop
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
  // TipTap's selector replaces manual event subscriptions for document-
  // derived state. Document identity represents `update`; meta-only
  // transactions compare equal and therefore do not re-render.
  const { tables } = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => ({
      tables: getTableInstances(currentEditor),
      doc: currentEditor.state.doc,
    }),
    equalityFn: (previous, next) => next !== null && previous.doc === next.doc,
  })
>>>>>>> 9e5b37638 (refactor(TableCaption, TableDragHandles): improve layout handling and test coverage)

  return (
    <>
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
          onClick={onTableSettingsModalOpen}
          aria-label={hasCaption ? "Edit table caption" : "Add table caption"}
        >
          {hasCaption ? "Edit" : "Add caption"}
        </Button>
      </Flex>

      {/* Mounted only while open so the form always initialises from the
          caption as it stands when the author opens the modal. */}
      {isTableSettingsModalOpen && (
        <TableSettingsModal
          caption={caption}
          isOpen
          onClose={onTableSettingsModalClose}
          onSave={onCaptionChange}
        />
      )}
    </>
  )
}
