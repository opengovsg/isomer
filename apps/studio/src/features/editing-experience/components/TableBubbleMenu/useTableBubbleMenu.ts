import type { Editor } from "@tiptap/react"
import { CellSelection, tableEditingKey } from "@tiptap/pm/tables"
import { useEditorState } from "@tiptap/react"
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
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
  TABLE_BUBBLE_MENU_PLUGIN_KEY,
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
    placement: "bottom-end"
    offset: number
    flip: boolean
    shift: boolean
    hide: boolean
    scrollTarget: HTMLElement | Window
  }
  appendTo: () => HTMLElement
  pluginKey: string
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
  const lastForcedVisibilityRef = useRef<boolean | null>(null)
  const [scrollTarget, setScrollTarget] = useState<HTMLElement | Window>(
    () => window,
  )

  const popoverContentRef = useCallback((node: HTMLElement | null) => {
    popoverContentElRef.current = node
  }, [])

  const [isActivated, setIsActivated] = useState(false)

  const { kind, selection, isDragging, isFocused } = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => ({
      kind: detectTableSelectionKind(currentEditor),
      selection: currentEditor.state.selection,
      isFocused: currentEditor.isFocused,
      isDragging: tableEditingKey.getState(currentEditor.state) != null,
    }),
    equalityFn: (previous, next) =>
      next !== null &&
      previous.kind === next.kind &&
      previous.selection.eq(next.selection) &&
      previous.isFocused === next.isFocused &&
      previous.isDragging === next.isDragging,
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

  const isMenuVisible = useCallback(
    (currentEditor: Editor, element?: HTMLElement) => {
      const currentKind = detectTableSelectionKind(currentEditor)
      const isChildOfMenu =
        (element?.contains(document.activeElement) ?? false) ||
        isWithinMenuFocusScope(document.activeElement)

      return (
        isActionableTableSelectionKind(currentKind) &&
        tableEditingKey.getState(currentEditor.state) == null &&
        !isEditorModalOpen() &&
        (currentEditor.isFocused ||
          currentEditor.view.hasFocus() ||
          menuHasFocusRef.current ||
          isChildOfMenu)
      )
    },
    [isWithinMenuFocusScope],
  )

  const shouldShowMenu = useCallback(
    ({
      editor: currentEditor,
      element,
    }: {
      editor: Editor
      view: Editor["view"]
      element: HTMLElement
    }) => isMenuVisible(currentEditor, element),
    [isMenuVisible],
  )

  const getReferencedVirtualElement = useCallback(() => {
    return createBottomRightVirtualElement(editor.view, editor.state)
  }, [editor])

  const bubbleMenuOptions = useMemo(
    () => ({
      strategy: "fixed" as const,
      placement: "bottom-end" as const,
      offset: 8,
      flip: true,
      shift: false,
      hide: false,
      scrollTarget,
    }),
    [scrollTarget],
  )

  const appendTo = useCallback(() => document.body, [])

  const syncForcedVisibility = useCallback(
    (visible: boolean) => {
      if (lastForcedVisibilityRef.current === visible) return
      lastForcedVisibilityRef.current = visible
      editor.commands.setMeta(
        TABLE_BUBBLE_MENU_PLUGIN_KEY,
        visible ? "show" : "hide",
      )
    },
    [editor],
  )

  useEffect(() => {
    const nextScrollTarget = getEditorScrollParent(editor.view)
    setScrollTarget((current) =>
      current === nextScrollTarget ? current : nextScrollTarget,
    )
    if (nextScrollTarget === scrollTarget) return

    editor.view.dispatch(
      editor.state.tr.setMeta(TABLE_BUBBLE_MENU_PLUGIN_KEY, {
        type: "updateOptions",
        options: {
          options: {
            ...bubbleMenuOptions,
            scrollTarget: nextScrollTarget,
          },
        },
      }),
    )
  }, [editor, selection, bubbleMenuOptions, scrollTarget])

  useEffect(() => {
    const visible =
      isActionableTableSelectionKind(kind) &&
      !isDragging &&
      !isEditorModalOpen() &&
      (isFocused ||
        editor.view.hasFocus() ||
        menuHasFocusRef.current ||
        isWithinMenuFocusScope(document.activeElement))

    syncForcedVisibility(visible)
  }, [
    editor,
    kind,
    isDragging,
    isFocused,
    isWithinMenuFocusScope,
    syncForcedVisibility,
  ])

  useEffect(() => {
    const onBlur = ({ event }: { event?: globalThis.FocusEvent }) => {
      const relatedTarget = event?.relatedTarget ?? null
      if (
        isWithinMenuFocusScope(relatedTarget) ||
        (isElement(relatedTarget) && editor.view.dom.contains(relatedTarget))
      ) {
        if (isWithinMenuFocusScope(relatedTarget)) {
          menuHasFocusRef.current = true
        }
        return
      }
      menuHasFocusRef.current = false
      setIsActivated(false)
    }
    editor.on("blur", onBlur)
    return () => {
      editor.off("blur", onBlur)
    }
  }, [editor, isWithinMenuFocusScope])

  useEffect(() => {
    const onFocusIn = (event: globalThis.FocusEvent) => {
      const target = event.target
      if (isWithinMenuFocusScope(target)) {
        menuHasFocusRef.current = true
        return
      }
      if (isElement(target) && editor.view.dom.contains(target)) {
        return
      }
      if (!menuHasFocusRef.current) return
      menuHasFocusRef.current = false
      setIsActivated(false)
      syncForcedVisibility(false)
    }

    document.addEventListener("focusin", onFocusIn)
    return () => {
      document.removeEventListener("focusin", onFocusIn)
    }
  }, [editor, isWithinMenuFocusScope, syncForcedVisibility])

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
    toggleMenu,
    deactivateMenu,
    shouldShow: shouldShowMenu,
    getReferencedVirtualElement,
    bubbleMenuOptions,
    appendTo,
    pluginKey: TABLE_BUBBLE_MENU_PLUGIN_KEY,
  }
}
