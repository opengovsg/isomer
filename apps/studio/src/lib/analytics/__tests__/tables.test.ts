import posthog from "posthog-js"
import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  captureTableCaptionSaved,
  captureTableCommand,
  captureTableCommandFailed,
  captureTableInserted,
} from "../tables"

vi.mock("posthog-js", () => ({
  default: { capture: vi.fn() },
}))

describe("table analytics", () => {
  beforeEach(() => {
    vi.mocked(posthog.capture).mockClear()
  })

  it("records an inserted table with the site id", () => {
    // Arrange / Act
    captureTableInserted({ siteId: 15, rows: 3, cols: 4 })

    // Assert
    expect(posthog.capture).toHaveBeenCalledWith("table_inserted", {
      site_id: 15,
      rows: 3,
      cols: 4,
    })
  })

  it("records a caption save against the placeholder it replaced", () => {
    // Arrange / Act
    captureTableCaptionSaved({ siteId: 15, replacedPlaceholder: true })

    // Assert
    expect(posthog.capture).toHaveBeenCalledWith("table_caption_saved", {
      site_id: 15,
      replaced_placeholder: true,
    })
  })

  it("records a successful command with its selection kind", () => {
    // Arrange / Act
    captureTableCommand({
      siteId: 15,
      outcome: "applied",
      action: "merge_cells",
      source: "bubble_menu",
      selectionKind: "multi-cell",
    })

    // Assert
    expect(posthog.capture).toHaveBeenCalledWith("table_action", {
      site_id: 15,
      action: "merge_cells",
      source: "bubble_menu",
      selection_kind: "multi-cell",
    })
  })

  it("records a rejected command without a selection kind", () => {
    // Arrange / Act
    captureTableCommand({
      siteId: 15,
      outcome: "rejected",
      action: "duplicate_row",
      source: "bubble_menu",
      selectionKind: "row",
    })

    // Assert
    expect(posthog.capture).toHaveBeenCalledWith("table_command_failed", {
      site_id: 15,
      action: "duplicate_row",
      source: "bubble_menu",
      reason: "command_rejected",
    })
  })

  it("records a drag that does not move as move_noop", () => {
    // Arrange / Act
    captureTableCommandFailed({
      siteId: 15,
      action: "move_column",
      source: "drag_handle",
      reason: "move_noop",
    })

    // Assert
    expect(posthog.capture).toHaveBeenCalledWith("table_command_failed", {
      site_id: 15,
      action: "move_column",
      source: "drag_handle",
      reason: "move_noop",
    })
  })

  it("does not record a command the menu already hid", () => {
    // Arrange / Act
    captureTableCommand({
      siteId: 15,
      outcome: "skipped",
      action: "duplicate_row",
      source: "bubble_menu",
      selectionKind: "header-row",
    })

    // Assert
    expect(posthog.capture).not.toHaveBeenCalled()
  })
})
