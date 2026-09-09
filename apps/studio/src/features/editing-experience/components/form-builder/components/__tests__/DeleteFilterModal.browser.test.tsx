import { ThemeProvider } from "@opengovsg/design-system-react"
import { render } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { MAX_TAG_OPTION_IDS_FOR_USAGE_COUNT } from "~/schemas/collection"
import { theme } from "~/theme"

import { DeleteFilterModal } from "../DeleteFilterModal"

type DeleteFilterModalTarget =
  | { type: "text"; tagOptionIds: string[] }
  | { type: "date"; dateFilterId: string }

const countTagOptionsUsage = vi.fn()
const countDateFilterUsage = vi.fn()

vi.mock("~/utils/trpc", () => ({
  trpc: {
    collection: {
      countTagOptionsUsage: {
        useSuspenseQuery: (...args: unknown[]): unknown =>
          countTagOptionsUsage(...args),
      },
      countDateFilterUsage: {
        useSuspenseQuery: (...args: unknown[]): unknown =>
          countDateFilterUsage(...args),
      },
    },
  },
}))

const renderModal = (target: DeleteFilterModalTarget) =>
  render(
    <ThemeProvider theme={theme}>
      <DeleteFilterModal
        isOpen
        siteId={1}
        pageId={1}
        target={target}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    </ThemeProvider>,
  )

describe("DeleteFilterModal", () => {
  beforeEach(() => {
    countTagOptionsUsage.mockReset()
    countDateFilterUsage.mockReset()
  })

  it("queries countTagOptionsUsage (not countDateFilterUsage) for a text filter target", () => {
    countTagOptionsUsage.mockReturnValue([{ count: 3 }])

    renderModal({ type: "text", tagOptionIds: ["opt-1"] })

    expect(document.body.textContent).toContain("3 items")
    expect(countTagOptionsUsage).toHaveBeenCalledExactlyOnceWith({
      siteId: 1,
      pageId: 1,
      tagOptionIds: ["opt-1"],
    })
    expect(countDateFilterUsage).not.toHaveBeenCalled()
  })

  it("queries countDateFilterUsage (not countTagOptionsUsage) for a date filter target", () => {
    countDateFilterUsage.mockReturnValue([{ count: 2 }])

    renderModal({ type: "date", dateFilterId: "date-1" })

    expect(document.body.textContent).toContain("2 items")
    expect(countDateFilterUsage).toHaveBeenCalledExactlyOnceWith({
      siteId: 1,
      pageId: 1,
      dateFilterId: "date-1",
    })
    expect(countTagOptionsUsage).not.toHaveBeenCalled()
  })

  it("skips the usage query and shows the large-count message when a text target exceeds the max", () => {
    const tagOptionIds = Array.from(
      { length: MAX_TAG_OPTION_IDS_FOR_USAGE_COUNT + 1 },
      (_, i) => `opt-${i}`,
    )

    renderModal({ type: "text", tagOptionIds })

    expect(document.body.textContent).toContain(
      "It’s being used on a large number of results.",
    )
    expect(countTagOptionsUsage).not.toHaveBeenCalled()
    expect(countDateFilterUsage).not.toHaveBeenCalled()
  })
})
