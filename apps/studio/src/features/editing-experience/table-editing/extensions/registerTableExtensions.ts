import { Table } from "@tiptap/extension-table"
import { TableCell } from "@tiptap/extension-table-cell"
import { TableHeader } from "@tiptap/extension-table-header"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { DEFAULT_TABLE_CAPTION } from "~/features/editing-experience/components/TableCaption/utils"
import { selectTableCellContent } from "~/features/editing-experience/hooks/useTextEditor/selectTableCellContent"
import { runTableBubbleMenuFocusTrigger } from "~/features/editing-experience/table-editing/bubble-menu/tableBubbleMenuFocus"
import {
  createInitialTableColumnResizeStorage,
  isTableColumnResizeDragging,
  tableColumnWidthNormalizerPlugin,
} from "~/features/editing-experience/table-editing/layout"
import {
  tableCellBackgroundColorAttribute,
  wrapHeaderToggleCommand,
  type HeaderToggleCommand,
} from "~/features/editing-experience/table-editing/tableCellBackground"
import { TableNodeView } from "~/features/editing-experience/table-editing/TableNodeView"
import { createTableSelectionBorderPlugin } from "~/features/editing-experience/utils"

export const IsomerTable = Table.extend({
  // Higher than TipTap's default keymap so Mod-a is handled here first.
  priority: 101,
  addCommands() {
    const parent = this.parent?.()
    const parentToggleHeaderRow = parent?.toggleHeaderRow
    const parentToggleHeaderColumn = parent?.toggleHeaderColumn

    return {
      ...parent,
      toggleHeaderRow: wrapHeaderToggleCommand(
        parentToggleHeaderRow?.() as HeaderToggleCommand | undefined,
      ),
      toggleHeaderColumn: wrapHeaderToggleCommand(
        parentToggleHeaderColumn?.() as HeaderToggleCommand | undefined,
      ),
    }
  },
  addAttributes() {
    return {
      caption: {
        default: DEFAULT_TABLE_CAPTION,
      },
      // Percent width per column index, stored on the table node. JSON only, not HTML.
      colwidths: {
        default: null,
      },
    }
  },
  addKeyboardShortcuts() {
    const parentShortcuts = this.parent?.() ?? {}
    return {
      ...parentShortcuts,
      "Mod-a": () =>
        selectTableCellContent(this.editor) || this.editor.commands.selectAll(),
      Tab: ({ editor }) => {
        if (runTableBubbleMenuFocusTrigger(editor)) {
          return true
        }
        return parentShortcuts.Tab?.({ editor }) ?? false
      },
    }
  },
  addStorage() {
    return createInitialTableColumnResizeStorage()
  },
  addProseMirrorPlugins() {
    return [
      tableColumnWidthNormalizerPlugin(),
      ...(this.parent?.() ?? []),
      createTableSelectionBorderPlugin(),
    ]
  },
  // Custom node view for caption, gutter, and percent colwidths. TipTap TableView does not support these.
  addNodeView() {
    return ReactNodeViewRenderer(TableNodeView, {
      contentDOMElementTag: "tbody",
      // Skip remount during colwidth drag so caption and handles stay mounted.
      update: ({ oldNode, newNode, updateProps }) => {
        if (
          isTableColumnResizeDragging(this.editor) &&
          oldNode.content.eq(newNode.content) &&
          oldNode.attrs.caption === newNode.attrs.caption
        ) {
          return true
        }
        updateProps()
        return true
      },
    })
  },
})

export const IsomerTableCell = TableCell.extend({
  content: "(paragraph|list)+",
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: tableCellBackgroundColorAttribute,
    }
  },
})

export const IsomerTableHeader = TableHeader.extend({
  content: "paragraph+",
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: tableCellBackgroundColorAttribute,
    }
  },
})
