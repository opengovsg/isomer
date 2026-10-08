import type { JsonFormsRendererRegistryEntry } from "@jsonforms/core"
import type { CollectionTags } from "~/features/editing-experience/hooks/useCollectionTags"
import { JsonForms } from "@jsonforms/react"
import { ThemeProvider } from "@opengovsg/design-system-react"
import {
  DEFAULT_COLLECTION_SORT_ORDER,
  TAG_CATEGORY_TYPE,
} from "@opengovsg/isomer-components"
import { Type } from "@sinclair/typebox"
import { render, waitFor } from "@testing-library/react"
import { useState } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { theme } from "~/theme"
import { ajv } from "~/utils/ajv"

import jsonFormsVerticalLayoutRenderer, {
  jsonFormsVerticalLayoutTester,
} from "../../layouts/JsonFormsVerticalLayout"
import JsonFormsCollectionSortOrderControl, {
  jsonFormsCollectionSortOrderControlTester,
} from "../JsonFormsCollectionSortOrderControl"

const useCollectionTags = vi.hoisted(() => vi.fn())

vi.mock("~/hooks/useQueryParse", () => ({
  useQueryParse: () => ({ siteId: 1, pageId: 1 }),
}))

vi.mock("~/features/editing-experience/hooks/useCollectionTags", () => ({
  useCollectionTags,
}))

const EVENT_FILTER_ID = "550e8400-e29b-41d4-a716-446655440000"
const DATE_FILTER_SORT_ORDER = `date-filter-${EVENT_FILTER_ID}-desc`
const SORT_ORDER_WARNING =
  "We couldn't load collection filters, so sort options are unavailable."

const schema = Type.Object({
  sortOrder: Type.String({
    title: "Sort items by",
    format: "collection-sort-order",
  }),
})

const renderers: JsonFormsRendererRegistryEntry[] = [
  {
    tester: jsonFormsCollectionSortOrderControlTester,
    renderer: JsonFormsCollectionSortOrderControl,
  },
  {
    tester: jsonFormsVerticalLayoutTester,
    renderer: jsonFormsVerticalLayoutRenderer,
  },
]

const eventDateFilter: CollectionTags[number] = {
  id: EVENT_FILTER_ID,
  label: "Event date",
  type: TAG_CATEGORY_TYPE.Date,
  isRequired: false,
  statusLabels: {
    ENDED: "Event ended",
    ONGOING: "Ongoing",
    UPCOMING: "Upcoming",
  },
}

const getEmittedSortOrders = (onChange: ReturnType<typeof vi.fn>): unknown[] =>
  onChange.mock.calls.map((call) => {
    const state = call[0] as { data?: { sortOrder?: unknown } }
    return state.data?.sortOrder
  })

const SortOrderForm = ({
  initialData,
  onChange,
}: {
  initialData: { sortOrder: string }
  onChange: (state: { data: { sortOrder: string } }) => void
}) => {
  const [data, setData] = useState(initialData)

  return (
    <JsonForms
      schema={schema}
      data={data}
      renderers={renderers}
      ajv={ajv}
      middleware={(state, action, reducer) => {
        const nextState = reducer(state, action)
        // Parent UPDATE_CORE runs after this control's mount handleChange and
        // would otherwise discard the rewrite; keep parent data in sync.
        if (action.type === "jsonforms/UPDATE") {
          setData(nextState.data as { sortOrder: string })
        }
        return nextState
      }}
      onChange={(state) => {
        onChange(state)
      }}
    />
  )
}

const renderForm = (initialData: { sortOrder: string }, onChange = vi.fn()) =>
  render(
    <ThemeProvider theme={theme}>
      <SortOrderForm initialData={initialData} onChange={onChange} />
    </ThemeProvider>,
  )

describe("JsonFormsCollectionSortOrderControl", () => {
  beforeEach(() => {
    useCollectionTags.mockReset()
  })

  it("shows a skeleton while collection tags are loading", () => {
    // Arrange
    useCollectionTags.mockReturnValue({
      data: undefined,
      isLoading: true,
      isSuccess: false,
      isError: false,
    })

    // Act
    renderForm({ sortOrder: DATE_FILTER_SORT_ORDER })

    // Assert
    expect(document.querySelector(".chakra-skeleton")).not.toBeNull()
    expect(document.body.textContent).not.toContain(SORT_ORDER_WARNING)
  })

  it("does not rewrite sort order when collection tags fail to load", async () => {
    // Arrange
    useCollectionTags.mockReturnValue({
      data: undefined,
      isLoading: false,
      isSuccess: false,
      isError: true,
    })
    const onChange = vi.fn()

    // Act
    renderForm({ sortOrder: DATE_FILTER_SORT_ORDER }, onChange)

    // Assert
    await waitFor(() => {
      expect(document.body.textContent).toContain(SORT_ORDER_WARNING)
    })
    expect(getEmittedSortOrders(onChange)).not.toContain(
      DEFAULT_COLLECTION_SORT_ORDER,
    )
    for (const sortOrder of getEmittedSortOrders(onChange)) {
      expect(sortOrder).toBe(DATE_FILTER_SORT_ORDER)
    }
  })

  it("resets a stale date-filter sort to the default when tags load", async () => {
    // Arrange
    useCollectionTags.mockReturnValue({
      data: [],
      isLoading: false,
      isSuccess: true,
      isError: false,
    })
    const onChange = vi.fn()

    // Act
    renderForm({ sortOrder: DATE_FILTER_SORT_ORDER }, onChange)

    // Assert
    await waitFor(() => {
      expect(getEmittedSortOrders(onChange)).toContain(
        DEFAULT_COLLECTION_SORT_ORDER,
      )
    })
    expect(getEmittedSortOrders(onChange).at(-1)).toBe(
      DEFAULT_COLLECTION_SORT_ORDER,
    )
  })

  it("keeps a valid date-filter sort when the matching filter is present", async () => {
    // Arrange
    useCollectionTags.mockReturnValue({
      data: [eventDateFilter],
      isLoading: false,
      isSuccess: true,
      isError: false,
    })
    const onChange = vi.fn()

    // Act
    renderForm({ sortOrder: DATE_FILTER_SORT_ORDER }, onChange)

    // Assert
    await waitFor(() => {
      expect(document.body.textContent).toContain("Sort items by")
      expect(getEmittedSortOrders(onChange).at(-1)).toBe(DATE_FILTER_SORT_ORDER)
    })
    expect(getEmittedSortOrders(onChange)).not.toContain(
      DEFAULT_COLLECTION_SORT_ORDER,
    )
  })
})
