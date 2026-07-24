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

  it("surfaces the server error message on failure", async () => {
    renderWith(adminAbility)

    fireEvent.click(screen.getByRole("checkbox", { name: /Audit logs/ }))
    fireEvent.click(screen.getByRole("button", { name: "Export log" }))
    await waitFor(() => expect(capturedOptions?.onError).toBeDefined())

    capturedOptions?.onError?.({
      message:
        "An export for this period and report type is already being generated",
      data: { code: "CONFLICT" },
    })

    expect(
      await screen.findByText(
        "An export for this period and report type is already being generated",
      ),
    ).not.toBeNull()
  })
})
