import { ThemeProvider } from "@opengovsg/design-system-react"
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { theme } from "~/theme"
import { RoleType } from "~prisma/generated/generatedEnums"

import { RedirectsSettings } from ".."
import { WILDCARD_HINT } from "../constants"

const SITE_ID = 42

// ~/env.mjs validates `process.env` at module scope, which is a ReferenceError
// under Browser Mode's real-browser runtime. The page picker reaches it via
// ~/utils/resources for a link prefix that never renders here.
vi.mock("~/env.mjs", () => ({
  env: { NEXT_PUBLIC_APP_URL: "http://localhost:3000" },
}))

// The wildcard hint and the bulk-upload entry point only render with advanced
// redirects on, which is the state these assertions are about.
vi.mock("~/hooks/useIsAdvancedRedirectsEnabled", () => ({
  useIsAdvancedRedirectsEnabled: () => true,
}))

const REDIRECT_ROW = {
  id: "1",
  source: "/old-news",
  destination: "https://www.example.gov.sg",
  publishedAt: new Date("2026-01-01T00:00:00Z"),
}

// What the site-wide roles query answers with. RedirectManagementProvider turns
// this into the ability under test, so these cases run through the real CASL
// rules rather than an ability injected past them. `undefined` roles stand for
// the query not having resolved, which pairs with isPending/isError below.
let currentRoles: { role: RoleType }[] | undefined = []
let rolesQueryState = { isPending: false, isError: false }

// The table's reads and every write the card/modal owns. None of them is what
// this test covers — the question is purely which controls a role is shown — so
// stub the tRPC surface with the minimum both branches touch on render.
vi.mock("~/utils/trpc", () => {
  const noop = vi.fn()
  return {
    trpc: {
      useUtils: () => ({ redirect: { invalidate: noop } }),
      resource: {
        getRolesFor: {
          useQuery: () => ({ data: currentRoles, ...rolesQueryState }),
        },
      },
      redirect: {
        list: { useQuery: () => ({ data: [REDIRECT_ROW], isLoading: false }) },
        count: { useQuery: () => ({ data: 1, isLoading: false }) },
        resolveReferences: { useQuery: () => ({ data: [] }) },
        create: { useMutation: () => ({ mutate: noop, isPending: false }) },
        delete: { useMutation: () => ({ mutate: noop, isPending: false }) },
        bulkValidate: { useMutation: () => ({ mutateAsync: noop }) },
        bulkCreate: {
          useMutation: () => ({ mutateAsync: noop, isPending: false }),
        },
      },
    },
  }
})

const renderRedirects = () =>
  render(
    <ThemeProvider theme={theme}>
      <RedirectsSettings siteId={SITE_ID} />
    </ThemeProvider>,
  )

const renderAs = (role: RoleType) => {
  currentRoles = [{ role }]
  return renderRedirects()
}

const DELETE_LABEL = `Delete redirect for ${REDIRECT_ROW.source}`
const PERMISSION_ERROR = /We couldn't check your permissions/

describe("RedirectsSettings", () => {
  beforeEach(() => {
    currentRoles = []
    rolesQueryState = { isPending: false, isError: false }
  })

  it("shows the add-redirect card, bulk upload and delete to a site admin", () => {
    // Arrange / Act
    renderAs(RoleType.Admin)

    // Assert
    expect(screen.queryByText("Add new redirects")).not.toBeNull()
    expect(
      screen.queryByRole("button", { name: "bulk upload with a .csv instead" }),
    ).not.toBeNull()
    expect(screen.queryByLabelText(DELETE_LABEL)).not.toBeNull()
  })

  it("hides every write control from a non-admin, who still sees the table", () => {
    // Arrange / Act — the server rejects create/delete for anyone but a site
    // admin, so a non-admin must not be handed inputs, a .csv template, or a
    // delete button whose submit can only come back FORBIDDEN.
    renderAs(RoleType.Editor)

    // Assert
    expect(screen.queryByText("Add new redirects")).toBeNull()
    expect(
      screen.queryByRole("button", { name: "bulk upload with a .csv instead" }),
    ).toBeNull()
    expect(screen.queryByLabelText(DELETE_LABEL)).toBeNull()
    expect(screen.queryByText(REDIRECT_ROW.source)).not.toBeNull()
  })

  it("keeps rows the same height whether or not the delete column renders", () => {
    // Arrange — dropping the delete column takes away the 2.5rem IconButton
    // that sets the row height, so without a pinned height a non-admin's rows
    // come out visibly shorter than the same table shown to an admin. Real
    // layout, hence Browser Mode.
    const rowHeightsFor = (role: RoleType) => {
      const { unmount } = renderAs(role)
      const heights = Array.from(document.querySelectorAll("tbody tr")).map(
        (row) => row.getBoundingClientRect().height,
      )
      unmount()
      return heights
    }

    // Act
    const adminHeights = rowHeightsFor(RoleType.Admin)
    const editorHeights = rowHeightsFor(RoleType.Editor)

    // Assert
    expect(adminHeights.length).toBeGreaterThan(0)
    expect(editorHeights).toEqual(adminHeights)
  })

  it("does not present the page as read-only while the roles are still loading", () => {
    // Arrange — an unresolved roles query leaves the ability permitting
    // nothing, which must not be shown as a settled "you can't do this": an
    // admin would be told they lack access and then contradicted a moment
    // later.
    currentRoles = undefined
    rolesQueryState = { isPending: true, isError: false }

    // Act
    renderRedirects()

    // Assert: no write controls yet, but no read-only page either — the table
    // holds its loading state rather than committing to a column set.
    expect(screen.queryByText("Add new redirects")).toBeNull()
    expect(screen.queryByLabelText(DELETE_LABEL)).toBeNull()
    expect(screen.queryByText(PERMISSION_ERROR)).toBeNull()
    expect(document.querySelector(".chakra-skeleton")).not.toBeNull()
  })

  it("says so when the roles query fails instead of silently going read-only", () => {
    // Arrange
    currentRoles = undefined
    rolesQueryState = { isPending: false, isError: true }

    // Act
    renderRedirects()

    // Assert
    expect(screen.queryByText(PERMISSION_ERROR)).not.toBeNull()
    expect(screen.queryByText("Add new redirects")).toBeNull()
    expect(screen.queryByLabelText(DELETE_LABEL)).toBeNull()
  })

  it("describes the wildcard in terms of folders and collections, not sections", () => {
    // Arrange / Act
    renderAs(RoleType.Admin)

    // Assert
    expect(screen.queryByText(WILDCARD_HINT)).not.toBeNull()
    expect(WILDCARD_HINT).not.toContain("section")
  })
})
