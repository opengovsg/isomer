// @vitest-environment jsdom
import type { UserManagementAbility } from "~/server/modules/permissions/permissions.type"
import * as growthbook from "@growthbook/growthbook-react"
import { ThemeProvider } from "@opengovsg/design-system-react"
import { render, screen, waitFor } from "@testing-library/react"
import * as nextRouter from "next/router"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { UserManagementContext } from "~/features/users"
import { SITE_ID } from "~/lib/testing/constants"
import AuditLogExportSettingsPage from "~/pages/sites/[siteId]/settings/audit-log"
import { buildUserManagementPermissions } from "~/server/modules/permissions/permissions.util"
import { theme } from "~/theme"
import { trpc } from "~/utils/trpc"
import { RoleType } from "~prisma/generated/generatedEnums"

// jsdom has no `matchMedia`; Chakra's `FullscreenSpinner` (rendered on the
// non-admin / loading paths) reads it via `useMediaQuery`.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
})

const replace = vi.fn()

let isGbReady = true
let isAuditLogFlagOn = true
let isRolesPending = false

beforeEach(() => {
  replace.mockClear()
  isRolesPending = false
  isGbReady = true
  isAuditLogFlagOn = true

  // SAFETY: test stub returns only the fields the component reads on render
  vi.spyOn(nextRouter, "useRouter").mockReturnValue({
    query: { siteId: String(SITE_ID) },
    replace,
  } as ReturnType<typeof nextRouter.useRouter>)

  vi.spyOn(growthbook, "useGrowthBook").mockImplementation(() => ({
    ready: isGbReady,
  }))

  vi.spyOn(growthbook, "useFeatureValue").mockImplementation(
    (_key, fallback) => (isGbReady ? isAuditLogFlagOn : fallback),
  )

  // SAFETY: test stub returns only the fields the component reads on render
  vi.spyOn(trpc.resource.getRolesFor, "useQuery").mockReturnValue({
    isPending: isRolesPending,
  } as ReturnType<typeof trpc.resource.getRolesFor.useQuery>)

  // SAFETY: test stub returns only the fields the component reads on render
  vi.spyOn(trpc.audit.getExportWindow, "useQuery").mockReturnValue({
    data: { maxMonths: 12 },
  } as ReturnType<typeof trpc.audit.getExportWindow.useQuery>)

  // SAFETY: test stub returns only the fields the component reads on render
  vi.spyOn(trpc.audit.createExportRequest, "useMutation").mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as ReturnType<typeof trpc.audit.createExportRequest.useMutation>)
})

const adminAbility = buildUserManagementPermissions([{ role: RoleType.Admin }])
const editorAbility = buildUserManagementPermissions([
  { role: RoleType.Editor },
])

const renderWith = (ability: UserManagementAbility) =>
  render(
    <ThemeProvider theme={theme}>
      <UserManagementContext.Provider value={ability}>
        <AuditLogExportSettingsPage />
      </UserManagementContext.Provider>
    </ThemeProvider>,
  )

describe("AuditLogExportSettingsPage", () => {
  it("renders the export section for admins", () => {
    // Arrange / Act
    renderWith(adminAbility)

    // Assert
    expect(screen.queryByRole("heading", { name: "Audit logs" })).not.toBeNull()
    expect(replace).not.toHaveBeenCalled()
  })

  it("redirects non-admins to the default settings page instead of showing a blank pane", async () => {
    // Arrange / Act
    renderWith(editorAbility)

    // Assert
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith(`/sites/${SITE_ID}/settings/agency`),
    )
    expect(screen.queryByRole("heading", { name: "Audit logs" })).toBeNull()
  })

  it("does not redirect while roles are still loading", () => {
    // Arrange
    isRolesPending = true

    // Act
    renderWith(editorAbility)

    // Assert
    expect(replace).not.toHaveBeenCalled()
    expect(screen.queryByRole("heading", { name: "Audit logs" })).toBeNull()
  })

  it("redirects admins away when the is-audit-log-enabled flag is off", async () => {
    // Arrange
    isAuditLogFlagOn = false

    // Act
    renderWith(adminAbility)

    // Assert: gated identically to the non-admin path
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith(`/sites/${SITE_ID}/settings/agency`),
    )
    expect(screen.queryByRole("heading", { name: "Audit logs" })).toBeNull()
  })

  it("does not redirect while GrowthBook features are still loading", () => {
    // Arrange: flags unfetched — `useFeatureValue` still returns its `false`
    // fallback, which must NOT be mistaken for the flag being off.
    isGbReady = false

    // Act
    renderWith(adminAbility)

    // Assert: spinner, no bounce
    expect(replace).not.toHaveBeenCalled()
    expect(screen.queryByRole("heading", { name: "Audit logs" })).toBeNull()
  })
})
