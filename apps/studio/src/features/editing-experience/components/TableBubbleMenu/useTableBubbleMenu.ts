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
    placement: "top-end"
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

  useEffect(() => {
    const nextScrollTarget = getEditorScrollParent(editor.view)
    setScrollTarget(nextScrollTarget)
    editor.view.dispatch(
      editor.state.tr.setMeta(TABLE_BUBBLE_MENU_PLUGIN_KEY, {
        type: "updateOptions",
        options: {
          options: {
            strategy: "fixed",
            placement: "top-end",
            offset: 4,
            flip: true,
            shift: false,
            hide: false,
            scrollTarget: nextScrollTarget,
          },
        },
      }),
    )
  }, [editor, selection])

  const isWithinMenuFocusScope = useCallback((target: EventTarget | null) => {
    if (!isElement(target)) return false
    const popoverContent = popoverContentElRef.current
    return (
      target === triggerRef.current ||
      (popoverContent?.contains(target) ?? false)
    )
  }, [])

  const shouldShowMenu = useCallback(
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
      const isChildOfMenu =
        element.contains(document.activeElement) ||
        isWithinMenuFocusScope(document.activeElement)

      return (
        isActionableTableSelectionKind(currentKind) &&
        tableEditingKey.getState(currentEditor.state) == null &&
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

  // BubbleMenu's plugin view only re-runs shouldShow when the doc or
  // selection changes. Clearing tableEditingKey on mouseup is plugin state
  // only, so force show/hide through the plugin meta API.
  useEffect(() => {
    const isChildOfMenu = isWithinMenuFocusScope(document.activeElement)
    const visible =
      isActionableTableSelectionKind(kind) &&
      !isDragging &&
      !isEditorModalOpen() &&
      (isFocused || menuHasFocusRef.current || isChildOfMenu)

    syncForcedVisibility(visible)
  }, [
    kind,
    isDragging,
    isFocused,
    isWithinMenuFocusScope,
    syncForcedVisibility,
  ])

  // appendTo body makes BubbleMenu treat document.body as parentNode, so
  // its own blur handler never hides (body contains the next focus target).
  useEffect(() => {
    const onFocusIn = (event: globalThis.FocusEvent) => {
      const target = event.target
      const inEditor = isElement(target) && editor.view.dom.contains(target)
      const inMenu = isWithinMenuFocusScope(target)

      if (inMenu) {
        menuHasFocusRef.current = true
        return
      }

      if (inEditor) {
        menuHasFocusRef.current = false
        return
      }

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
