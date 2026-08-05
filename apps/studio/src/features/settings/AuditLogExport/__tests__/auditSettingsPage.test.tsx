// @vitest-environment jsdom
import type { UserManagementAbility } from "~/server/modules/permissions/permissions.type"
import { ThemeProvider } from "@opengovsg/design-system-react"
import { render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { UserManagementContext } from "~/features/users"
import AuditLogExportSettingsPage from "~/pages/sites/[siteId]/settings/audit"
import { buildUserManagementPermissions } from "~/server/modules/permissions/permissions.util"
import { theme } from "~/theme"
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

const SITE_ID = 42

const replace = vi.fn()

vi.mock("next/router", () => ({
  useRouter: () => ({
    query: { siteId: String(SITE_ID) },
    replace,
  }),
}))

// The page is additionally gated on the `is-audit-log-enabled` GrowthBook
// flag, and defers to `gb.ready` so a slow flag fetch never bounces an admin.
// Drive both per-test; `useFeatureValue` mirrors the real hook's behaviour of
// returning the fallback until features are loaded.
let isGbReady = true
let isAuditLogFlagOn = true
vi.mock("@growthbook/growthbook-react", () => ({
  useGrowthBook: () => ({ ready: isGbReady }),
  useFeatureValue: (_key: string, fallback: boolean) =>
    isGbReady ? isAuditLogFlagOn : fallback,
}))

// The page reads `getRolesFor` only for its loading signal; the ability itself
// comes from `UserManagementContext`. Drive `isPending` per-test.
let isRolesPending = false
vi.mock("~/utils/trpc", () => ({
  trpc: {
    resource: {
      getRolesFor: {
        useQuery: () => ({ isPending: isRolesPending }),
      },
    },
    audit: {
      getExportWindow: {
        useQuery: () => ({ data: { maxMonths: 12 } }),
      },
      createExportRequest: {
        useMutation: () => ({ mutate: vi.fn(), isPending: false }),
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
        <AuditLogExportSettingsPage />
      </UserManagementContext.Provider>
    </ThemeProvider>,
  )

describe("AuditLogExportSettingsPage", () => {
  beforeEach(() => {
    replace.mockClear()
    isRolesPending = false
    isGbReady = true
    isAuditLogFlagOn = true
  })

  it("renders the export section for admins", () => {
    // Arrange / Act
    renderWith(adminAbility)

    // Assert
    expect(screen.queryByRole("heading", { name: "Logs" })).not.toBeNull()
    expect(replace).not.toHaveBeenCalled()
  })

  it("redirects non-admins to the default settings page instead of showing a blank pane", async () => {
    // Arrange / Act
    renderWith(editorAbility)

    // Assert
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith(`/sites/${SITE_ID}/settings/agency`),
    )
    expect(screen.queryByRole("heading", { name: "Logs" })).toBeNull()
  })

  it("does not redirect while roles are still loading", () => {
    // Arrange
    isRolesPending = true

    // Act
    renderWith(editorAbility)

    // Assert
    expect(replace).not.toHaveBeenCalled()
    expect(screen.queryByRole("heading", { name: "Logs" })).toBeNull()
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
    expect(screen.queryByRole("heading", { name: "Logs" })).toBeNull()
  })

  it("does not redirect while GrowthBook features are still loading", () => {
    // Arrange: flags unfetched — `useFeatureValue` still returns its `false`
    // fallback, which must NOT be mistaken for the flag being off.
    isGbReady = false

    // Act
    renderWith(adminAbility)

    // Assert: spinner, no bounce
    expect(replace).not.toHaveBeenCalled()
    expect(screen.queryByRole("heading", { name: "Logs" })).toBeNull()
  })
})
