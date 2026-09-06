// @vitest-environment jsdom
import type { UserManagementAbility } from "~/server/modules/permissions/permissions.type"
import { ThemeProvider } from "@opengovsg/design-system-react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import posthog from "posthog-js"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { UserManagementContext } from "~/features/users"
import { SITE_ID } from "~/lib/testing/constants"
import {
  AuditLogExportRequestedReportType,
  AuditLogExportScope,
} from "~/schemas/audit"
import { buildUserManagementPermissions } from "~/server/modules/permissions/permissions.util"
import { theme } from "~/theme"
import { trpc } from "~/utils/trpc"
import { RoleType } from "~prisma/generated/generatedEnums"

import { AuditLogExportSection } from "../AuditLogExportSection"
import { getMonthOptions } from "../utils"

interface CreateExportRequestInput {
  scope: string
  siteId: number
  month: string
  reportType: string
}

interface CreateExportMutationOptions {
  onSuccess?: (data: void, variables: CreateExportRequestInput) => void
  onError?: (error: { message: string; data: { code: string } }) => void
}

const posthogCapture = vi.fn()
const mutate = vi.fn()
let capturedOptions: CreateExportMutationOptions | undefined

const fireOnSuccessForLastMutation = () => {
  // SAFETY: test fixture supplies only the fields required by the assertion under test
  const variables = mutate.mock.lastCall?.[0] as CreateExportRequestInput
  capturedOptions?.onSuccess?.(undefined, variables)
}

vi.spyOn(posthog, "capture").mockImplementation(posthogCapture)
// SAFETY: test stub returns only the fields the component reads on render
vi.spyOn(trpc.audit.getExportWindow, "useQuery").mockReturnValue({
  data: { maxMonths: 12 },
} as ReturnType<typeof trpc.audit.getExportWindow.useQuery>)
vi.spyOn(trpc.audit.createExportRequest, "useMutation").mockImplementation(
  (options?: CreateExportMutationOptions) => {
    capturedOptions = options
    return { mutate, isPending: false }
  },
)

const adminAbility = buildUserManagementPermissions([{ role: RoleType.Admin }])
const editorAbility = buildUserManagementPermissions([
  { role: RoleType.Editor },
])

const renderWith = (ability: UserManagementAbility) =>
  render(
    <ThemeProvider theme={theme}>
      <UserManagementContext.Provider value={ability}>
        <AuditLogExportSection siteId={SITE_ID} />
      </UserManagementContext.Provider>
    </ThemeProvider>,
  )

describe("AuditLogExportSection", () => {
  beforeEach(() => {
    mutate.mockClear()
    posthogCapture.mockClear()
    capturedOptions = undefined
  })

  it("does not render for non-admins", () => {
    renderWith(editorAbility)
    expect(screen.queryByRole("heading", { name: "Audit logs" })).toBeNull()
  })

  it("renders the heading, the link to User management, and an enabled submit for admins", () => {
    renderWith(adminAbility)
    expect(screen.queryByRole("heading", { name: "Audit logs" })).not.toBeNull()
    expect(
      screen
        .getByRole("link", { name: "User management" })
        .getAttribute("href"),
    ).toBe(`/sites/${SITE_ID}/users`)
    const submit = screen.getByRole("button", { name: "Export logs" })
    expect(submit).toBeEnabled()
  })

  it("defaults the export scope to 'This site only'", () => {
    renderWith(adminAbility)
    const siteOnly = screen.getByRole("radio", { name: "This site only" })
    const allSites = screen.getByRole("radio", {
      name: "All sites I have Admin access to",
    })
    expect(siteOnly).toBeChecked()
    expect(allSites).not.toBeChecked()
  })

  // This section only ever requests the Activity log now — Access-log export
  // moved to its own button on the Users page — so the month picker defaulting
  // to the most recent (current, partial) month is what proves the payload is
  // wired through correctly.
  it("submits the current month, the Activity report type, and the default 'site' scope with the site id", async () => {
    renderWith(adminAbility)

    fireEvent.click(screen.getByRole("button", { name: "Export logs" }))

    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1))
    expect(mutate).toHaveBeenCalledWith({
      scope: AuditLogExportScope.Site,
      siteId: SITE_ID,
      month: getMonthOptions()[0]!.value,
      reportType: AuditLogExportRequestedReportType.Activity,
    })
  })

  // The site's own id is always sent regardless of scope — the server
  // ignores it and resolves the caller's admin sites itself for "allSites".
  it("submits scope 'allSites' when that radio is picked", async () => {
    renderWith(adminAbility)

    fireEvent.click(
      screen.getByRole("radio", { name: "All sites I have Admin access to" }),
    )
    fireEvent.click(screen.getByRole("button", { name: "Export logs" }))

    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1))
    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ scope: "allSites", siteId: 42 }),
    )
  })

  // NOTE: there is no duplicate-request failure path any more — the server
  // accepts duplicate asks idempotently (ADR docs/adr/0005) — so the error
  // surface only exists for genuine rejections like an out-of-window month.
  it("surfaces the server error message on failure", async () => {
    renderWith(adminAbility)

    fireEvent.click(screen.getByRole("button", { name: "Export logs" }))
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
  // SAFETY: test stub returns only the fields the component reads on render
  it("treats a repeated identical submission as a plain success", async () => {
    renderWith(adminAbility)

    // First ask.
    fireEvent.click(screen.getByRole("button", { name: "Export logs" }))
    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1))

    fireOnSuccessForLastMutation()

    // The success handler also reports the requested log type to PostHog.
    await waitFor(() => expect(posthogCapture).toHaveBeenCalledTimes(1))
    expect(posthogCapture).toHaveBeenCalledWith(
      "audit_log_requested",
      expect.objectContaining({ site_id: SITE_ID }),
    )

    // Ask again, identically.
    fireEvent.click(screen.getByRole("button", { name: "Export logs" }))
    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(2))
    // Identical payload both times — the duplicate is sent as-is; the server
    // idempotent-accepts it rather than erroring.
    expect(mutate.mock.calls[1]).toEqual(mutate.mock.calls[0])
  })
})
