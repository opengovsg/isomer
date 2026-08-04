// @vitest-environment jsdom
import type { UserManagementAbility } from "~/server/modules/permissions/permissions.type"
import { ThemeProvider } from "@opengovsg/design-system-react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { UserManagementContext } from "~/features/users"
import { AuditLogExportRequestedReportType } from "~/schemas/audit"
import { buildUserManagementPermissions } from "~/server/modules/permissions/permissions.util"
import { theme } from "~/theme"
import { RoleType } from "~prisma/generated/generatedEnums"

import { AuditLogExportSection } from "../AuditLogExportSection"
import { getMonthOptions } from "../utils"

// Capture what the component passes to the mutation so we can assert on the
// submitted payload and drive the onError branch ourselves.
const mutate = vi.fn()
let capturedOptions:
  | { onSuccess?: () => void; onError?: (error: unknown) => void }
  | undefined

vi.mock("~/utils/trpc", () => ({
  trpc: {
    audit: {
      // The full window, as if the site were old enough to offer it — the
      // capped-window behaviour itself is covered by getMaxExportableMonths'
      // and getMonthOptions' own unit tests.
      getExportWindow: {
        useQuery: () => ({ data: { maxMonths: 12 } }),
      },
      createExportRequest: {
        useMutation: (options: typeof capturedOptions) => {
          capturedOptions = options
          return { mutate, isPending: false }
        },
      },
    },
  },
}))

const adminAbility = buildUserManagementPermissions([{ role: RoleType.Admin }])
const editorAbility = buildUserManagementPermissions([
  { role: RoleType.Editor },
])

const renderWith = (ability: UserManagementAbility) =>
  render(
    <ThemeProvider theme={theme}>
      <UserManagementContext.Provider value={ability}>
        <AuditLogExportSection siteId={42} />
      </UserManagementContext.Provider>
    </ThemeProvider>,
  )

describe("AuditLogExportSection", () => {
  beforeEach(() => {
    mutate.mockClear()
    capturedOptions = undefined
  })

  it("does not render for non-admins", () => {
    renderWith(editorAbility)
    expect(screen.queryByRole("heading", { name: "Logs" })).toBeNull()
  })

  it("renders the heading and a disabled submit for admins", () => {
    renderWith(adminAbility)
    expect(screen.queryByRole("heading", { name: "Logs" })).not.toBeNull()
    // With nothing selected the submit is the disabled call-to-action.
    const submit = screen.getByRole("button", {
      name: "Select log types to export",
    })
    expect((submit as HTMLButtonElement).disabled).toBe(true)
  })

  // Each selectable card maps onto a report type; picking both yields `Both`.
  // The month picker defaults to the most recent (current, partial) month, so
  // the submitted payload proves the cards + month + site id are wired through.
  it("submits the selected report types and month with the site id", async () => {
    renderWith(adminAbility)

    fireEvent.click(
      screen.getByRole("checkbox", { name: /User access review logs/ }),
    )
    fireEvent.click(screen.getByRole("checkbox", { name: /Audit logs/ }))

    fireEvent.click(screen.getByRole("button", { name: "Export log" }))

    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1))
    const [payload] = mutate.mock.calls[0] as [
      { siteId: number; month: string; reportType: string },
    ]
    expect(payload).toEqual({
      siteId: 42,
      month: getMonthOptions()[0]!.value,
      reportType: AuditLogExportRequestedReportType.Both,
    })
  })

  // NOTE: there is no duplicate-request failure path any more — the server
  // accepts duplicate asks idempotently (ADR docs/adr/0005) — so the error
  // surface only exists for genuine rejections like an out-of-window month.
  it("surfaces the server error message on failure", async () => {
    renderWith(adminAbility)

    fireEvent.click(screen.getByRole("checkbox", { name: /Audit logs/ }))
    fireEvent.click(screen.getByRole("button", { name: "Export log" }))
    await waitFor(() => expect(capturedOptions?.onError).toBeDefined())

    capturedOptions?.onError?.({
      message: "You cannot export audit logs for a month that is in the future",
      data: { code: "BAD_REQUEST" },
    })

    expect(
      await screen.findByText(
        "You cannot export audit logs for a month that is in the future",
      ),
    ).not.toBeNull()
  })

  // A duplicate ask is a success, not an error: submitting the same form
  // twice issues two identical mutations and the success handler runs for each.
  it("treats a repeated identical submission as a plain success", async () => {
    renderWith(adminAbility)

    // First ask: pick a log type and submit.
    fireEvent.click(screen.getByRole("checkbox", { name: /Audit logs/ }))
    fireEvent.click(screen.getByRole("button", { name: "Export log" }))
    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1))

    // Success resets the form (see the section's onSuccess), returning the
    // disabled call-to-action; wait for that before asking again.
    capturedOptions?.onSuccess?.()
    await waitFor(() =>
      expect(
        screen.queryByRole("button", {
          name: "Select log types to export",
        }),
      ).not.toBeNull(),
    )

    // Ask again, identically.
    fireEvent.click(screen.getByRole("checkbox", { name: /Audit logs/ }))
    fireEvent.click(screen.getByRole("button", { name: "Export log" }))
    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(2))
    // Identical payload both times — the duplicate is sent as-is; the server
    // idempotent-accepts it rather than erroring.
    expect(mutate.mock.calls[1]).toEqual(mutate.mock.calls[0])
  })
})
