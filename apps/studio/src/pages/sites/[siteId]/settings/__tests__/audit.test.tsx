// @vitest-environment jsdom
import type { UserManagementAbility } from "~/server/modules/permissions/permissions.type"
import { ThemeProvider } from "@opengovsg/design-system-react"
import { render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { UserManagementContext } from "~/features/users"
import { buildUserManagementPermissions } from "~/server/modules/permissions/permissions.util"
import { theme } from "~/theme"
import { RoleType } from "~prisma/generated/generatedEnums"

import AuditLogExportSettingsPage from "../audit"

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
  })

  it("renders the export section for admins", () => {
    renderWith(adminAbility)
    expect(screen.queryByText("Audit log export")).not.toBeNull()
    expect(replace).not.toHaveBeenCalled()
  })

  it("redirects non-admins to the default settings page instead of showing a blank pane", async () => {
    renderWith(editorAbility)

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith(`/sites/${SITE_ID}/settings/agency`),
    )
    expect(screen.queryByText("Audit log export")).toBeNull()
  })

  it("does not redirect while roles are still loading", () => {
    isRolesPending = true
    renderWith(editorAbility)

    expect(replace).not.toHaveBeenCalled()
    expect(screen.queryByText("Audit log export")).toBeNull()
  })
})
