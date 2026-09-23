import type { SelectionKind } from "~/features/editing-experience/components/TableBubbleMenu/TableBubbleMenu.types"
import posthog from "posthog-js"

export type TableCommandOutcome = "applied" | "rejected" | "skipped"

export type TableAction =
  | "merge_cells"
  | "split_cell"
  | "duplicate_row"
  | "duplicate_column"
  | "move_row"
  | "move_column"
  | "add_row"
  | "add_column"
  | "delete_row"
  | "delete_column"
  | "delete_table"
  | "clear_contents"
  | "toggle_header_row"
  | "toggle_header_column"
  | "set_cell_background"

export type TableActionSource =
  | "bubble_menu"
  | "drag_handle"
  | "add_pill"
  | "toolbar"

export type TableCommandFailureReason = "command_rejected" | "move_noop"

interface TableAnalyticsContext {
  siteId: number
}

const tableContext = ({ siteId }: TableAnalyticsContext) => ({
  site_id: siteId,
})

export const captureTableInserted = ({
  siteId,
  rows,
  cols,
}: TableAnalyticsContext & { rows: number; cols: number }) => {
  posthog.capture("table_inserted", {
    ...tableContext({ siteId }),
    rows,
    cols,
  })
}

export const captureTableCaptionSaved = ({
  siteId,
  replacedPlaceholder,
}: TableAnalyticsContext & { replacedPlaceholder: boolean }) => {
  posthog.capture("table_caption_saved", {
    ...tableContext({ siteId }),
    replaced_placeholder: replacedPlaceholder,
  })
}

export const captureTableCommandFailed = ({
  siteId,
  action,
  source,
  reason,
}: TableAnalyticsContext & {
  action: TableAction | "insert_table"
  source: TableActionSource
  reason: TableCommandFailureReason
}) => {
  posthog.capture("table_command_failed", {
    ...tableContext({ siteId }),
    action,
    source,
    reason,
  })
}

export const captureTableCommand = ({
  siteId,
  outcome,
  action,
  source,
  selectionKind,
  reason = "command_rejected",
}: TableAnalyticsContext & {
  outcome: TableCommandOutcome
  action: TableAction
  source: TableActionSource
  selectionKind: SelectionKind
  reason?: TableCommandFailureReason
}) => {
  if (outcome === "skipped") return

  if (outcome === "applied") {
    posthog.capture("table_action", {
      ...tableContext({ siteId }),
      action,
      source,
      selection_kind: selectionKind,
    })
    return
  }

  captureTableCommandFailed({ siteId, action, source, reason })
}
