// @vitest-environment jsdom
import type { UserManagementAbility } from "~/server/modules/permissions/permissions.type"
import { ThemeProvider } from "@opengovsg/design-system-react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
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
    expect(screen.queryByRole("button", { name: "Request export" })).toBeNull()
  })

  it("renders the heading and form for admins", () => {
    renderWith(adminAbility)
    expect(screen.queryByText("Audit log export")).not.toBeNull()
    expect(
      screen.queryByRole("button", { name: "Request export" }),
    ).not.toBeNull()
  })

  // The month + report type selectors are pre-filled with valid defaults (the
  // most recent month and "Both"). The SingleSelect option list is virtualised
  // and does not render under jsdom, so we assert against those defaults rather
  // than driving the dropdown — the submitted payload still proves the form
  // wires the selected month + type + site id into the mutation.
  it("submits the selected month and report type with the site id", async () => {
    const user = userEvent.setup()
    renderWith(adminAbility)

    await user.click(screen.getByRole("button", { name: "Request export" }))

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
    const user = userEvent.setup()
    renderWith(adminAbility)

    await user.click(screen.getByRole("button", { name: "Request export" }))
    expect(capturedOptions?.onError).toBeDefined()

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
