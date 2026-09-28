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
        name: "Request access to Agency site",
      }),
    )

    // Assert
    expect(screen.getByText("alpha@agency.gov.sg")).not.toBeNull()
    expect(screen.getByText("beta@agency.gov.sg")).not.toBeNull()
    expect(screen.getAllByRole("button", { name: "Copy email" })).toHaveLength(
      2,
    )
  })

  it("copies the admin email for that row", async () => {
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
        name: "Request access to Agency site",
      }),
    )

    // Act
    fireEvent.click(screen.getByRole("button", { name: "Copy email" }))

    // Assert
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith("alpha@agency.gov.sg"),
    )
  })

  it("asks the user to contact Isomer Support when the site has no admins", async () => {
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
        name: "Request access to Empty site",
      }),
    )

    // Assert
    expect(
      screen.getByText(/There are no site admins for this site/),
    ).not.toBeNull()
    const support = screen.getByRole("link", { name: "Isomer Support" })
    expect(support.getAttribute("href")).toBe("mailto:support@isomer.gov.sg")
  })
})
