import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { IsomerLogo, IsomerLogoSymbol } from "../IsomerLogo"
import { OgpLogo, OgpLogoSymbol } from "../OgpLogo"

describe("credit logo sprite", () => {
  it("emits each logo path once and points every instance at that symbol", () => {
    // Arrange
    const logos = (
      <svg xmlns="http://www.w3.org/2000/svg">
        <IsomerLogoSymbol />
        <OgpLogoSymbol />
        <IsomerLogo />
        <IsomerLogo />
        <OgpLogo />
        <OgpLogo />
      </svg>
    )

    // Act
    const html = renderToStaticMarkup(logos)

    // Assert
    expect(html.match(/M105\.842/g)).toHaveLength(1)
    expect(html.match(/M54\.0417/g)).toHaveLength(1)
    expect(html.match(/href="#isomer-credit-logo"/g)).toHaveLength(2)
    expect(html.match(/href="#ogp-credit-logo"/g)).toHaveLength(2)
  })
})
