// @vitest-environment jsdom
import { ThemeProvider } from "@opengovsg/design-system-react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { theme } from "~/theme"

import { ExpiredSiteAccess } from "../ExpiredSiteAccess"

const { expiredSites } = vi.hoisted(() => ({
  expiredSites: {
    current: [] as {
      id: number
      config: { siteName: string; logoUrl?: string }
      adminEmails: string[]
    }[],
  },
}))

vi.mock("~/utils/trpc", () => ({
  trpc: {
    site: {
      listExpired: {
        useSuspenseQuery: () => [expiredSites.current],
      },
    },
  },
}))

vi.mock("~/features/me/api", () => ({
  useMe: () => ({
    me: { email: "alex_lee@agency.gov.sg", name: "Alex Lee" },
    logout: vi.fn(),
    isOnboarded: true,
  }),
}))

vi.mock("next/router", () => ({
  useRouter: () => ({ isReady: true }),
}))

const renderSection = () =>
  render(
    <ThemeProvider theme={theme}>
      <ExpiredSiteAccess />
    </ThemeProvider>,
  )

describe("ExpiredSiteAccess", () => {
  beforeEach(() => {
    expiredSites.current = []
  })

  it("renders nothing when the user has no expired sites", () => {
    // Arrange / Act
    renderSection()

    // Assert
    expect(
      screen.queryByRole("heading", { name: "Sites you had access to" }),
    ).toBeNull()
  })

  it("opens a modal listing site admin emails", async () => {
    // Arrange
    expiredSites.current = [
      {
        id: 1,
        config: { siteName: "Agency site", logoUrl: "" },
        adminEmails: ["alpha@agency.gov.sg", "beta@agency.gov.sg"],
      },
    ]

    // Act
    renderSection()
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Get access back to Agency site",
      }),
    )

    // Assert
    expect(screen.getByText("Get access back to Agency site")).not.toBeNull()
    expect(screen.getByText("alpha@agency.gov.sg")).not.toBeNull()
    expect(screen.getByText("beta@agency.gov.sg")).not.toBeNull()
    expect(screen.getAllByRole("button", { name: "Copy email" })).toHaveLength(
      2,
    )
    expect(screen.getByText(/alex_lee@agency.gov.sg/)).not.toBeNull()
  })

  it("copies the admin email for that row and shows Copied", async () => {
    // Arrange
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    expiredSites.current = [
      {
        id: 1,
        config: { siteName: "Agency site", logoUrl: "" },
        adminEmails: ["alpha@agency.gov.sg"],
      },
    ]
    renderSection()
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Get access back to Agency site",
      }),
    )

    // Act
    fireEvent.click(screen.getByRole("button", { name: "Copy email" }))

    // Assert
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith("alpha@agency.gov.sg"),
    )
    expect(screen.getByRole("button", { name: "Copied" })).not.toBeNull()
  })

  it("asks the user to contact Isomer support when the site has no admins", async () => {
    // Arrange
    expiredSites.current = [
      {
        id: 1,
        config: { siteName: "Empty site", logoUrl: "" },
        adminEmails: [],
      },
    ]

    // Act
    renderSection()
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Get access back to Empty site",
      }),
    )

    // Assert
    expect(
      screen.getByText("Contact Isomer support to get access back"),
    ).not.toBeNull()
    expect(screen.getByText(/no active site admins/)).not.toBeNull()
    const support = screen.getByRole("link", { name: "Contact Isomer support" })
    expect(support.getAttribute("href")).toContain(
      "mailto:support@isomer.gov.sg",
    )
    expect(support.getAttribute("href")).toContain(
      "subject=Request%20access%20back%20to%20Empty%20site",
    )
    expect(support.getAttribute("href")).toContain("Login%20email%3A")
  })
})
