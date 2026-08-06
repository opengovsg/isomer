// @vitest-environment jsdom
import type { UserManagementAbility } from "~/server/modules/permissions/permissions.type"
import { ThemeProvider } from "@opengovsg/design-system-react"
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { UserManagementContext } from "~/features/users"
import { getCurrentSingaporeMonth } from "~/schemas/audit"
import { buildUserManagementPermissions } from "~/server/modules/permissions/permissions.util"
import { theme } from "~/theme"
import { RoleType } from "~prisma/generated/generatedEnums"

import { ExportAccessLogsButton } from "../ExportAccessLogsButton"

const SITE_ID = 42

// The button is hidden while the is-audit-log-enabled flag is off (or not yet
// loaded) — drive the flag per-test.
let isAuditLogFlagOn = true
vi.mock("@growthbook/growthbook-react", () => ({
  useFeatureValue: (_key: string, fallback: boolean) =>
    isAuditLogFlagOn || fallback,
}))

// The shared export hook fires PostHog captures on success; the mutation mock
// below never resolves, so only the submitted payload matters here.
vi.mock("posthog-js", () => ({ default: { capture: vi.fn() } }))

const mutate = vi.fn()
vi.mock("~/utils/trpc", () => ({
  trpc: {
    audit: {
      createExportRequest: {
        useMutation: () => ({ mutate, isPending: false }),
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
        <ExportAccessLogsButton siteId={SITE_ID} />
      </UserManagementContext.Provider>
    </ThemeProvider>,
  )

describe("ExportAccessLogsButton", () => {
  beforeEach(() => {
    mutate.mockClear()
    isAuditLogFlagOn = true
  })

  it("requests a current-month Access export on click", () => {
    // Arrange
    renderWith(adminAbility)

    // Act
    fireEvent.click(screen.getByRole("button", { name: "Export access logs" }))

    // Assert: same mutation the settings export form issues — Access report,
    // pinned to the current Singapore month.
    expect(mutate).toHaveBeenCalledTimes(1)
    expect(mutate).toHaveBeenCalledWith({
      siteId: SITE_ID,
      month: getCurrentSingaporeMonth(),
      reportType: "Access",
    })
  })

  it("renders nothing while the is-audit-log-enabled flag is off", () => {
    // Arrange
    isAuditLogFlagOn = false

    // Act
    renderWith(adminAbility)

    // Assert
    expect(
      screen.queryByRole("button", { name: "Export access logs" }),
    ).toBeNull()
  })

  it("renders nothing for non-admins — exporting access logs is admin-only", () => {
    // Arrange / Act
    renderWith(editorAbility)

    // Assert
    expect(
      screen.queryByRole("button", { name: "Export access logs" }),
    ).toBeNull()
    expect(mutate).not.toHaveBeenCalled()
  })
})
