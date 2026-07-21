import type { IsomerComponent, IsomerSiteProps } from "~/types"
import { describe, expect, it, vi } from "vitest"

import { renderPageContentSkeleton } from "./renderPageContentSkeleton"

const site = {
  siteName: "Test",
  siteMap: {
    id: "1",
    title: "Home",
    permalink: "/",
    lastModified: "",
    layout: "content",
    summary: "",
  },
  siteMapArray: [],
  theme: "isomer-next",
  isGovernment: true,
  url: "https://example.com",
  logoUrl: "/logo.svg",
  navbar: { items: [] },
  footerItems: {
    privacyStatementLink: "/",
    termsOfUseLink: "/",
    siteNavItems: [],
  },
  lastUpdated: "1 Jan 2021",
  search: { type: "localSearch", searchUrl: "/search" },
} as IsomerSiteProps

describe("renderPageContentSkeleton", () => {
  it("calls the injected renderComponent for each visible block", () => {
    // Arrange
    const renderComponent = vi.fn(() => <div />)
    const content = [
      { type: "prose", content: [] },
      { type: "prose", content: [] },
    ] as IsomerComponent[]

    // Act
    renderPageContentSkeleton({
      content,
      layout: "content",
      site,
      permalink: "/about",
      renderComponent,
    })

    // Assert
    expect(renderComponent).toHaveBeenCalledTimes(2)
    expect(renderComponent.mock.calls[0]?.[0]).toMatchObject({
      elementKey: 0,
      component: content[0],
      permalink: "/about",
    })
    expect(renderComponent.mock.calls[1]?.[0]).toMatchObject({
      elementKey: 1,
      component: content[1],
    })
  })

  it("skips hidden childrenpages blocks", () => {
    // Arrange
    const renderComponent = vi.fn(() => <div />)
    const content = [
      {
        type: "childrenpages",
        isHidden: true,
        summary: "",
      },
      { type: "prose", content: [] },
    ] as IsomerComponent[]

    // Act
    renderPageContentSkeleton({
      content,
      layout: "index",
      site,
      permalink: "/folder",
      renderComponent,
    })

    // Assert
    expect(renderComponent).toHaveBeenCalledTimes(1)
    expect(renderComponent.mock.calls[0]?.[0]).toMatchObject({
      component: { type: "prose" },
    })
  })
})
