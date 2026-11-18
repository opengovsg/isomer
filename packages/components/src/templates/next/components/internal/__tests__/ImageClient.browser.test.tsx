import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { ImageClient } from "../ImageClient"
import { ImageRetryProvider } from "../ImageClient/ImageRetryContext"

const renderImage = (withProvider: boolean) => {
  const image = (
    <ImageClient
      src="/image.png"
      alt="test"
      width="100%"
      className=""
      assetsBaseUrl="https://assets.example.com"
    />
  )
  render(
    withProvider ? <ImageRetryProvider>{image}</ImageRetryProvider> : image,
  )
  return screen.getByRole("img")
}

describe("ImageClient error handling", () => {
  it("shows the placeholder immediately without the retry provider", () => {
    // Arrange
    const img = renderImage(false)

    // Act
    fireEvent.error(img)

    // Assert
    expect(img.getAttribute("src")).toContain("placeholder_no_image.png")
  })

  it("keeps the image src to retry when the retry provider is present", () => {
    // Arrange
    const img = renderImage(true)

    // Act
    fireEvent.error(img)

    // Assert
    expect(img.getAttribute("src")).not.toContain("placeholder_no_image.png")
  })
})
