import {
  COLLECTION_SORT_ORDER,
  TAG_CATEGORY_TYPE,
} from "@opengovsg/isomer-components"

import type { CollectionTags } from "../../hooks/useCollectionTags"
import { getCollectionSortOptions } from "../getCollectionSortOptions"

const EVENT_FILTER_ID = "550e8400-e29b-41d4-a716-446655440000"
const DEADLINE_FILTER_ID = "6ba7b810-9dad-11d1-80b4-00c04fd430c8"

const tagCategories: CollectionTags = [
  {
    id: EVENT_FILTER_ID,
    label: "Event date",
    type: TAG_CATEGORY_TYPE.Date,
    isRequired: false,
    statusLabels: {
      ENDED: "Event ended",
      ONGOING: "Ongoing",
      UPCOMING: "Upcoming",
    },
  },
  {
    id: DEADLINE_FILTER_ID,
    label: "Registration deadline",
    type: TAG_CATEGORY_TYPE.Date,
    isRequired: false,
    statusLabels: {
      ENDED: "Event ended",
      ONGOING: "Ongoing",
      UPCOMING: "Upcoming",
    },
  },
  {
    id: "c70df43e-8bff-46a5-889a-3a35e5f6a702",
    label: "Topic",
    isRequired: true,
    options: [{ id: "some-option-id", label: "Technology" }],
  },
]

describe("getCollectionSortOptions", () => {
  it("returns only the four base options when there are no date filters", () => {
    // Arrange / Act
    const options = getCollectionSortOptions()

    // Assert
    expect(options).toHaveLength(4)
    expect(options[0]).toEqual({
      value: COLLECTION_SORT_ORDER.DateDesc,
      label: "By item date, newest → oldest",
    })
  })

  it("adds newest and oldest options for each date filter", () => {
    // Arrange / Act
    const options = getCollectionSortOptions(tagCategories)

    // Assert
    expect(options).toHaveLength(8)
    expect(options[4]).toEqual({
      value: `date-filter-${EVENT_FILTER_ID}-desc`,
      label: "By Event date, newest → oldest",
    })
    expect(options[6]).toEqual({
      value: `date-filter-${DEADLINE_FILTER_ID}-desc`,
      label: "By Registration deadline, newest → oldest",
    })
  })
})
