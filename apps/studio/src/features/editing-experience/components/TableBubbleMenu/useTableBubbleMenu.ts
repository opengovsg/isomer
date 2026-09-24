import type { Editor } from "@tiptap/react"
import { CellSelection, selectedRect, tableEditingKey } from "@tiptap/pm/tables"
import { useEditorState } from "@tiptap/react"
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type RefCallback,
  type RefObject,
} from "react"
import {
  hasHeaderColumn,
  hasHeaderRow,
} from "~/features/editing-experience/utils/tableHeaderAxis"

import type { SelectionKind } from "./TableBubbleMenu.types"
import {
  detectTableSelectionKind,
  isEditorModalOpen,
} from "./TableBubbleMenu.utils"
import {
  registerTableBubbleMenuFocusTrigger,
  unregisterTableBubbleMenuFocusTrigger,
} from "./tableBubbleMenuFocus"
import {
  useTableBubbleMenuPosition,
  type TableBubbleMenuPosition,
} from "./useTableBubbleMenuPosition"

export interface TableBubbleMenuUiState {
  show: boolean
  kind: SelectionKind
  isActivated: boolean
  menuRef: RefCallback<HTMLDivElement>
  actionsRef: RefCallback<HTMLDivElement>
  triggerRef: RefObject<HTMLButtonElement>
  triggerPosition: TableBubbleMenuPosition | null
  actionsPosition: TableBubbleMenuPosition | null
  onMenuFocus: () => void
  onMenuBlur: (event: FocusEvent<HTMLElement>) => void
  toggleMenu: () => void
  deactivateMenu: () => void
}

const isElement = (target: EventTarget | null): target is Element =>
  target instanceof Element

const getSelectionRangeKey = (selection: Editor["state"]["selection"]) =>
  selection instanceof CellSelection
    ? `${selection.$anchorCell.pos}:${selection.$headCell.pos}`
    : `${selection.from}:${selection.to}`

const getTableHeaderAxisKey = (editor: Editor) => {
  const { selection } = editor.state
  if (!(selection instanceof CellSelection)) return ""
  const rect = selectedRect(editor.state)
  return `${hasHeaderRow(rect) ? "r" : ""}${hasHeaderColumn(rect) ? "c" : ""}`
}

export const useTableBubbleMenu = (
  editor: Editor,
  isDragReordering = false,
): TableBubbleMenuUiState => {
  const menuElRef = useRef<HTMLDivElement | null>(null)
  const [menuEl, setMenuEl] = useState<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const menuRef = useCallback((node: HTMLDivElement | null) => {
    menuElRef.current = node
    setMenuEl(node)
  }, [])
  const [actionsEl, setActionsEl] = useState<HTMLDivElement | null>(null)
  const actionsRef = useCallback((node: HTMLDivElement | null) => {
    setActionsEl(node)
  }, [])

  const [isActivated, setIsActivated] = useState(false)
  const [menuHasFocus, setMenuHasFocus] = useState(false)

  const { kind, selection, isDragging, isFocused } = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => ({
      kind: detectTableSelectionKind(currentEditor),
      selection: currentEditor.state.selection,
      headerAxisKey: getTableHeaderAxisKey(currentEditor),
      isFocused: currentEditor.isFocused,
      isDragging: tableEditingKey.getState(currentEditor.state) != null,
    }),
    equalityFn: (previous, next) =>
      next !== null &&
      previous.kind === next.kind &&
      previous.selection.eq(next.selection) &&
      previous.headerAxisKey === next.headerAxisKey &&
      previous.isFocused === next.isFocused &&
      previous.isDragging === next.isDragging,
  })

  const show =
    kind !== "none" &&
    !isDragging &&
    !isDragReordering &&
    !isEditorModalOpen() &&
    (isFocused || menuHasFocus)

  const selectionRangeKey = getSelectionRangeKey(selection)
  const [activatedForSelection, setActivatedForSelection] =
    useState(selectionRangeKey)
  // Close in this render, not after paint, so positioning measures the pencil
  // and not the still-open actions list.
  const selectionMoved = activatedForSelection !== selectionRangeKey
  if (selectionMoved) {
    setActivatedForSelection(selectionRangeKey)
    setIsActivated(false)
  }

  useEffect(() => {
    if (!show) {
      setIsActivated(false)
    }
  }, [show])

  const { trigger: triggerPosition, actions: actionsPosition } =
    useTableBubbleMenuPosition({
      editor,
      menuEl,
      actionsEl,
      show,
      layoutKey: selectionRangeKey,
    })

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
    const isMenuElement = (target: EventTarget | null) =>
      isElement(target) && (menuElRef.current?.contains(target) ?? false)

    const isWithinFocusScope = (target: EventTarget | null) =>
      isElement(target) &&
      (isMenuElement(target) || editor.view.dom.contains(target))

    const onBlur = ({ event }: { event?: globalThis.FocusEvent }) => {
      const relatedTarget = event?.relatedTarget ?? null
      if (isWithinFocusScope(relatedTarget)) {
        if (isMenuElement(relatedTarget)) {
          setMenuHasFocus(true)
        }
        return
      }
      setMenuHasFocus(false)
    }
    editor.on("blur", onBlur)
    return () => {
      editor.off("blur", onBlur)
    }
  }, [editor])

  const onMenuFocus = () => setMenuHasFocus(true)

  const onMenuBlur = (event: FocusEvent<HTMLElement>) => {
    const relatedTarget = event.relatedTarget
    if (
      isElement(relatedTarget) &&
      ((menuElRef.current?.contains(relatedTarget) ?? false) ||
        editor.view.dom.contains(relatedTarget))
    ) {
      return
    }
    setMenuHasFocus(false)
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
    show,
    kind,
    isActivated,
    menuRef,
    actionsRef,
    triggerRef,
    triggerPosition,
    actionsPosition,
    onMenuFocus,
    onMenuBlur,
    toggleMenu,
    deactivateMenu,
  }
}
