import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { LinkButton } from "../LinkButton"
import { Link } from "./Link"

const NestedLinkText = () => <span>Nested link text</span>

describe(Link, () => {
  it.each([
    ["plain text", "Access the full list"],
    ["URL-like text", "https://www.example.com"],
    ["email text", "mailto:test@example.com"],
  ])("uses visible %s as its accessible name", (_, text) => {
    // Arrange
    const { getByRole } = render(<Link href="/destination">{text}</Link>)

    // Act
    const link = getByRole("link", { name: text })

    // Assert
    expect(link.getAttribute("aria-label")).toBeNull()
    expect(link.querySelector(".sr-only")).toBeNull()
  })

  it("appends new-tab context to an external link's accessible name", () => {
    // Arrange
    const { getByRole } = render(
      <Link href="https://www.example.com" isExternal>
        Access the full list
      </Link>,
    )

    // Act
    const link = getByRole("link", {
      name: "Access the full list (opens in new tab)",
    })

    // Assert
    expect(link.getAttribute("aria-label")).toBeNull()
    expect(link.getAttribute("target")).toBe("_blank")
    expect(link.getAttribute("rel")).toBe("noopener nofollow")
    expect(link.querySelector(".sr-only")?.textContent).toBe(
      " (opens in new tab)",
    )
  })

  it("hides the decorative external icon from the accessible name", () => {
    // Arrange
    const { getByRole } = render(
      <Link href="https://www.scamshield.gov.sg" isExternal showExternalIcon>
        ScamShield
      </Link>,
    )

    // Act
    const link = getByRole("link", {
      name: "ScamShield (opens in new tab)",
    })
    const externalIcon = link.querySelector('[aria-hidden="true"]')

    // Assert
    expect(externalIcon?.textContent).toBe(" ↗")
  })

  it("includes text rendered by a nested component in the accessible name", () => {
    // Arrange
    const { getByRole } = render(
      <Link href="https://www.example.com" isExternal>
        <NestedLinkText />
      </Link>,
    )

    // Act
    const link = getByRole("link", {
      name: "Nested link text (opens in new tab)",
    })

    // Assert
    expect(link.getAttribute("aria-label")).toBeNull()
  })

  it("appends new-tab context to an explicit icon-only accessible name", () => {
    // Arrange
    const { getByRole } = render(
      <Link
        href="https://www.example.com"
        isExternal
        label="Example social media page"
      >
        <span aria-hidden="true">↗</span>
      </Link>,
    )

    // Act
    const link = getByRole("link", {
      name: "Example social media page (opens in new tab)",
    })

    // Assert
    expect(link.getAttribute("aria-label")).toBe(
      "Example social media page (opens in new tab)",
    )
    expect(link.querySelector(".sr-only")).toBeNull()
  })

  it("preserves an explicit accessible name for an internal icon-only link", () => {
    // Arrange
    const { getByRole } = render(
      <Link href="/profile" label="View profile">
        <span aria-hidden="true">→</span>
      </Link>,
    )

    // Act
    const link = getByRole("link", { name: "View profile" })

    // Assert
    expect(link.getAttribute("aria-label")).toBe("View profile")
  })

  it("provides new-tab context through LinkButton", () => {
    // Arrange
    const { getByRole } = render(
      <LinkButton href="https://www.example.com">View service</LinkButton>,
    )

    // Act
    const link = getByRole("link", {
      name: "View service (opens in new tab)",
    })

    // Assert
    expect(link.getAttribute("aria-label")).toBeNull()
    expect(link.getAttribute("target")).toBe("_blank")
  })
})
