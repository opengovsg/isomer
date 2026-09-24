import { ThemeProvider } from "@opengovsg/design-system-react"
import { TAG_CATEGORY_TYPE } from "@opengovsg/isomer-components"
import { render } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { MAX_TAG_OPTION_IDS_FOR_USAGE_COUNT } from "~/schemas/collection"
import { theme } from "~/theme"

import {
  DeleteFilterModal,
  type DeleteFilterModalTarget,
} from "../DeleteFilterModal"

const countFilterUsage = vi.fn()

vi.mock("~/utils/trpc", () => ({
  trpc: {
    collection: {
      countFilterUsage: {
        useSuspenseQuery: (...args: unknown[]): unknown =>
          countFilterUsage(...args),
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
    countFilterUsage.mockReset()
  })

  it("queries countFilterUsage with the text filter target", () => {
    countFilterUsage.mockReturnValue([{ count: 3 }])

    renderModal({
      type: TAG_CATEGORY_TYPE.Text,
      tagOptionIds: ["opt-1"],
    })

    expect(document.body.textContent).toContain("3 items")
    expect(countFilterUsage).toHaveBeenCalledExactlyOnceWith({
      siteId: 1,
      pageId: 1,
      type: TAG_CATEGORY_TYPE.Text,
      tagOptionIds: ["opt-1"],
    })
  })

  it("queries countFilterUsage with the date filter target", () => {
    countFilterUsage.mockReturnValue([{ count: 2 }])

    renderModal({
      type: TAG_CATEGORY_TYPE.Date,
      dateFilterId: "date-1",
    })

    expect(document.body.textContent).toContain("2 items")
    expect(countFilterUsage).toHaveBeenCalledExactlyOnceWith({
      siteId: 1,
      pageId: 1,
      type: TAG_CATEGORY_TYPE.Date,
      dateFilterId: "date-1",
    })
  })

  it("skips the usage query and shows the large-count message when a text target exceeds the max", () => {
    const tagOptionIds = Array.from(
      { length: MAX_TAG_OPTION_IDS_FOR_USAGE_COUNT + 1 },
      (_, i) => `opt-${i}`,
    )

    renderModal({ type: TAG_CATEGORY_TYPE.Text, tagOptionIds })

    expect(document.body.textContent).toContain(
      "It’s being used on a large number of results.",
    )
    expect(countFilterUsage).not.toHaveBeenCalled()
  })
})
