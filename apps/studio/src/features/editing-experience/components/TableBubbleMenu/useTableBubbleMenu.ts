import type { Editor } from "@tiptap/react"
import { CellSelection, tableEditingKey } from "@tiptap/pm/tables"
import { useEditorState } from "@tiptap/react"
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type RefObject,
} from "react"

import type { SelectionKind } from "./TableBubbleMenu.types"
import {
  detectTableSelectionKind,
  isActionableTableSelectionKind,
  isEditorModalOpen,
} from "./TableBubbleMenu.utils"
import {
  createBottomRightVirtualElement,
  getEditorScrollParent,
} from "./tableBubbleMenuAnchor"
import {
  registerTableBubbleMenuFocusTrigger,
  unregisterTableBubbleMenuFocusTrigger,
} from "./tableBubbleMenuFocus"

export interface TableBubbleMenuUiState {
  kind: SelectionKind
  isActivated: boolean
  triggerRef: RefObject<HTMLButtonElement>
  popoverContentRef: (node: HTMLElement | null) => void
  onMenuFocus: () => void
  onMenuBlur: (event: FocusEvent<HTMLElement>) => void
  toggleMenu: () => void
  deactivateMenu: () => void
  shouldShow: (props: {
    editor: Editor
    view: Editor["view"]
    element: HTMLElement
  }) => boolean
  getReferencedVirtualElement: () => ReturnType<
    typeof createBottomRightVirtualElement
  >
  bubbleMenuOptions: {
    strategy: "fixed"
    placement: "top-end"
    offset: number
    flip: boolean
    scrollTarget: HTMLElement | Window
  }
  appendTo: () => HTMLElement
}

const isElement = (target: EventTarget | null): target is Element =>
  target instanceof Element

const getSelectionRangeKey = (selection: Editor["state"]["selection"]) =>
  selection instanceof CellSelection
    ? `${selection.$anchorCell.pos}:${selection.$headCell.pos}`
    : `${selection.from}:${selection.to}`

export const useTableBubbleMenu = (editor: Editor): TableBubbleMenuUiState => {
  const popoverContentElRef = useRef<HTMLElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuHasFocusRef = useRef(false)

  const popoverContentRef = useCallback((node: HTMLElement | null) => {
    popoverContentElRef.current = node
  }, [])

  const [isActivated, setIsActivated] = useState(false)

  const { kind, selection } = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => ({
      kind: detectTableSelectionKind(currentEditor),
      selection: currentEditor.state.selection,
    }),
    equalityFn: (previous, next) =>
      next !== null &&
      previous.kind === next.kind &&
      previous.selection.eq(next.selection),
  })

  const selectionRangeKey = getSelectionRangeKey(selection)

  useEffect(() => {
    setIsActivated(false)
  }, [selectionRangeKey])

  useEffect(() => {
    registerTableBubbleMenuFocusTrigger(editor, () => {
      const trigger = triggerRef.current
      if (!trigger) return false
      trigger.focus()
      return true
    })
    return () => {
      unregisterTableBubbleMenuFocusTrigger(editor)
    }
  }, [editor])

  const isWithinMenuFocusScope = useCallback((target: EventTarget | null) => {
    if (!isElement(target)) return false
    const popoverContent = popoverContentElRef.current
    return (
      target === triggerRef.current ||
      (popoverContent?.contains(target) ?? false)
    )
  }, [])

  const shouldShow = useCallback(
    ({
      editor: currentEditor,
      view,
      element,
    }: {
      editor: Editor
      view: Editor["view"]
      element: HTMLElement
    }) => {
      const currentKind = detectTableSelectionKind(currentEditor)
      const isDragging = tableEditingKey.getState(currentEditor.state) != null
      const isChildOfMenu =
        element.contains(document.activeElement) ||
        isWithinMenuFocusScope(document.activeElement)

      return (
        isActionableTableSelectionKind(currentKind) &&
        !isDragging &&
        !isEditorModalOpen() &&
        (view.hasFocus() ||
          currentEditor.isFocused ||
          menuHasFocusRef.current ||
          isChildOfMenu)
      )
    },
    [isWithinMenuFocusScope],
  )

  const getReferencedVirtualElement = useCallback(() => {
    return createBottomRightVirtualElement(editor.view, editor.state)
  }, [editor])

  const bubbleMenuOptions = useMemo(
    () => ({
      strategy: "fixed" as const,
      placement: "top-end" as const,
      offset: 4,
      flip: true,
      scrollTarget: getEditorScrollParent(editor.view),
    }),
    [editor],
  )

  const appendTo = useCallback(() => document.body, [])

  const onMenuFocus = () => {
    menuHasFocusRef.current = true
  }

  const onMenuBlur = (event: FocusEvent<HTMLElement>) => {
    const relatedTarget = event.relatedTarget
    if (
      isWithinMenuFocusScope(relatedTarget) ||
      (isElement(relatedTarget) && editor.view.dom.contains(relatedTarget))
    ) {
      return
    }
    menuHasFocusRef.current = false
    setIsActivated(false)
  }

  const toggleMenu = () => {
    setIsActivated((activated) => {
      const next = !activated
      if (next) {
        editor.commands.focus()
      }
      return next
    })
  }

  const deactivateMenu = () => {
    setIsActivated(false)
  }

  return {
    kind,
    isActivated,
    triggerRef,
    popoverContentRef,
    onMenuFocus,
    onMenuBlur,
    toggleMenu,
    deactivateMenu,
    shouldShow,
    getReferencedVirtualElement,
    bubbleMenuOptions,
    appendTo,
  }
}
