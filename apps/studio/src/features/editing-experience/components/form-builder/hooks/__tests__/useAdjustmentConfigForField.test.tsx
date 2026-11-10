// @vitest-environment jsdom

import type { PropsWithChildren } from "react"
import { JsonFormsStateProvider } from "@jsonforms/react"
import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useAdjustmentConfigForField } from "../useAdjustmentConfigForField"

// useCollectionIndexVariant issues a tRPC query (only enabled for collection
// thumbnails, which none of these cases are). Stub it so the renderHook wrapper
// doesn't need a tRPC provider.
vi.mock("./useCollectionIndexVariant", () => ({
  useCollectionIndexVariant: () => undefined,
}))

const renderWithData = (data: unknown, path: string) =>
  renderHook(() => useAdjustmentConfigForField(path), {
    wrapper: ({ children }: PropsWithChildren) => (
      <JsonFormsStateProvider
        initState={{ core: { data, schema: {}, uischema: undefined } }}
      >
        {children}
      </JsonFormsStateProvider>
    ),
  })

describe("useAdjustmentConfigForField", () => {
  it("resolves a root-level image field to the block's own config", () => {
    const data = {
      type: "hero",
      variant: "floating",
      backgroundUrl: "/1/uuid/file.png",
    }
    const { result } = renderWithData(data, "backgroundUrl")

    expect(result.current.block).toBe(data)
    expect(result.current.fieldHost).toBe(data)
    expect(result.current.fieldName).toBe("backgroundUrl")
    expect(result.current.siblingPath).toBe("backgroundUrlImageAdjustment")
    expect(result.current.config?.componentType).toBe("hero:floating")
  })

  it("resolves an array-nested card field to the InfoCards config, with fieldHost = the card", () => {
    const card = { imageUrl: "/1/uuid/card.png" }
    const data = {
      type: "infocards",
      variant: "cardsWithImages",
      cards: [card],
    }
    const { result } = renderWithData(data, "cards.0.imageUrl")

    expect(result.current.block).toBe(data)
    expect(result.current.fieldHost).toBe(card)
    expect(result.current.fieldName).toBe("imageUrl")
    expect(result.current.siblingPath).toBe("cards.0.imageUrlImageAdjustment")
    expect(result.current.config?.componentType).toBe(
      "infocards:cardsWithImages",
    )
  })

  it("returns undefined for a nested, unregistered field", () => {
    const data = {
      type: "infocards",
      variant: "cardsWithImages",
      cards: [{ imageUrl: "/1/uuid/card.png", someOtherField: "x" }],
    }
    const { result } = renderWithData(data, "cards.0.someOtherField")

    expect(result.current.config).toBeUndefined()
  })
})
