// @vitest-environment jsdom
import type { UserManagementAbility } from "~/server/modules/permissions/permissions.type"
import { ThemeProvider } from "@opengovsg/design-system-react"
import { fireEvent, render, screen } from "@testing-library/react"
import { createStore, Provider } from "jotai"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { UserManagementContext } from "~/features/users"
import { exportAccessLogsModalAtom } from "~/features/users/atoms"
import { SITE_ID } from "~/lib/testing/constants"
import { getCurrentSingaporeMonth } from "~/schemas/audit"
import { getCurrentSingaporeMonth } from "~/schemas/audit"
import { buildUserManagementPermissions } from "~/server/modules/permissions/permissions.util"
import { theme } from "~/theme"
import { RoleType } from "~prisma/generated/generatedEnums"

import { ExportAccessLogsButton } from "../ExportAccessLogsButton"

// The button is hidden while the is-audit-log-enabled flag is off (or not yet
// loaded) — drive the flag per-test.
let isAuditLogFlagOn = true
vi.mock("@growthbook/growthbook-react", () => ({
  useFeatureValue: (_key: string, fallback: boolean) =>
    isAuditLogFlagOn || fallback,
}))

const adminAbility = buildUserManagementPermissions([{ role: RoleType.Admin }])
const editorAbility = buildUserManagementPermissions([
  { role: RoleType.Editor },
])

const renderWith = (
  ability: UserManagementAbility,
  store: ReturnType<typeof createStore>,
) =>
  render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <UserManagementContext.Provider value={ability}>
          <ExportAccessLogsButton siteId={SITE_ID} />
        </UserManagementContext.Provider>
      </ThemeProvider>
    </Provider>,
  )

describe("ExportAccessLogsButton", () => {
  let store: ReturnType<typeof createStore>

  beforeEach(() => {
    store = createStore()
    isAuditLogFlagOn = true
  })

  // The button itself no longer requests an export directly — it opens
  // ExportAccessLogsModal (rendered once at the page level), which lets the
  // admin pick a scope before firing the request.
  it("opens the export access logs modal for this site on click", () => {
    // Arrange
    renderWith(adminAbility, store)

    // Act
    fireEvent.click(screen.getByRole("button", { name: "Export user access" }))

    // Assert
    expect(store.get(exportAccessLogsModalAtom)).toEqual({
      siteId: SITE_ID,
      isOpen: true,
    })
  })

  it("renders nothing while the is-audit-log-enabled flag is off", () => {
    // Arrange
    isAuditLogFlagOn = false

    // Act
    renderWith(adminAbility, store)

    // Assert
    expect(
      screen.queryByRole("button", { name: "Export user access" }),
    ).toBeNull()
  })

  it("renders nothing for non-admins — exporting access logs is admin-only", () => {
    // Arrange / Act
    renderWith(editorAbility, store)

    // Assert
    expect(
      screen.queryByRole("button", { name: "Export user access" }),
    ).toBeNull()
    expect(store.get(exportAccessLogsModalAtom)).toEqual({
      siteId: 0,
      isOpen: false,
    })
  })
})
