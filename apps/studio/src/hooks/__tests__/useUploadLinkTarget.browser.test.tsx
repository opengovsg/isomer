import type { PropsWithChildren } from "react"
import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { UploadLinkTargetProvider } from "~/contexts/UploadLinkTargetContext"
import { AssetLinkSource } from "~prisma/generated/generatedEnums"

import { useUploadLinkTarget } from "../useUploadLinkTarget"

const { routerQuery } = vi.hoisted(() => {
  const current: Record<string, string> = {}
  return { routerQuery: { current } }
})

vi.mock("next/router", () => ({
  useRouter: () => ({ query: routerQuery.current }),
}))

describe("useUploadLinkTarget", () => {
  beforeEach(() => {
    routerQuery.current = { siteId: "1" }
  })

  it("returns the site-wide source declared by the page", () => {
    // Arrange
    const wrapper = ({ children }: PropsWithChildren) => (
      <UploadLinkTargetProvider source={AssetLinkSource.NAVBAR}>
        {children}
      </UploadLinkTargetProvider>
    )

    // Act
    const { result } = renderHook(() => useUploadLinkTarget(), { wrapper })

    // Assert
    expect(result.current).toEqual({ source: AssetLinkSource.NAVBAR })
  })

  it("returns the page from the route", () => {
    // Arrange
    routerQuery.current = { siteId: "1", pageId: "42" }

    // Act
    const { result } = renderHook(() => useUploadLinkTarget())

    // Assert
    expect(result.current).toEqual({ resourceId: "42" })
  })

  it("returns the collection link from the route", () => {
    // Arrange
    routerQuery.current = { siteId: "1", linkId: "7" }

    // Act
    const { result } = renderHook(() => useUploadLinkTarget())

    // Assert
    expect(result.current).toEqual({ resourceId: "7" })
  })

  it("returns undefined when neither the page nor the route names a target", () => {
    // Arrange / Act
    const { result } = renderHook(() => useUploadLinkTarget())

    // Assert
    expect(result.current).toBeUndefined()
  })
})
