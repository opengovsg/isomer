import { describe, expect, it } from "vitest"
import { DATE_FILTER_STATUS } from "~/types/constants"

import { buildDateFilterStatusLabels } from "../buildDateFilterStatusLabels"

const DEFAULT_STATUS_LABELS = [
  {
    id: DATE_FILTER_STATUS.Ended.id,
    label: DATE_FILTER_STATUS.Ended.defaultLabel,
  },
  {
    id: DATE_FILTER_STATUS.Ongoing.id,
    label: DATE_FILTER_STATUS.Ongoing.defaultLabel,
  },
  {
    id: DATE_FILTER_STATUS.Upcoming.id,
    label: DATE_FILTER_STATUS.Upcoming.defaultLabel,
  },
]

describe("buildDateFilterStatusLabels", () => {
  it("returns default labels for every status when no overrides are given", () => {
    // Act
    const result = buildDateFilterStatusLabels()

    // Assert
    expect(result).toEqual(DEFAULT_STATUS_LABELS)
  })

  it("returns default labels when the override map is empty", () => {
    // Arrange
    const categoryLabels = {}

    // Act
    const result = buildDateFilterStatusLabels(categoryLabels)

    // Assert
    expect(result).toEqual(DEFAULT_STATUS_LABELS)
  })

  it("overrides only the labels that are provided", () => {
    // Arrange
    const categoryLabels = {
      [DATE_FILTER_STATUS.Ended.id]: "Registration closed",
    }

    // Act
    const result = buildDateFilterStatusLabels(categoryLabels)

    // Assert
    expect(result).toEqual([
      {
        id: DATE_FILTER_STATUS.Ended.id,
        label: "Registration closed",
      },
      {
        id: DATE_FILTER_STATUS.Ongoing.id,
        label: DATE_FILTER_STATUS.Ongoing.defaultLabel,
      },
      {
        id: DATE_FILTER_STATUS.Upcoming.id,
        label: DATE_FILTER_STATUS.Upcoming.defaultLabel,
      },
    ])
  })

  it("overrides every status label when a full map is provided", () => {
    // Arrange
    const categoryLabels = {
      [DATE_FILTER_STATUS.Ended.id]: "Registration closed",
      [DATE_FILTER_STATUS.Ongoing.id]: "Registration open",
      [DATE_FILTER_STATUS.Upcoming.id]: "Registration upcoming",
    }

    // Act
    const result = buildDateFilterStatusLabels(categoryLabels)

    // Assert
    expect(result).toEqual([
      {
        id: DATE_FILTER_STATUS.Ended.id,
        label: "Registration closed",
      },
      {
        id: DATE_FILTER_STATUS.Ongoing.id,
        label: "Registration open",
      },
      {
        id: DATE_FILTER_STATUS.Upcoming.id,
        label: "Registration upcoming",
      },
    ])
  })
})
