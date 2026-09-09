import type { CollectionTags } from "../../hooks/useCollectionTags"
import { validateRequiredDateFilters } from "../validateRequiredDateFilters"

const REQUIRED_DATE_FILTER_ID = "f47ac10b-58cc-4372-a567-0e02b2c3d479"
const OPTIONAL_DATE_FILTER_ID = "a58bd21c-69dd-5483-b678-1f13c3d4e580"
const OTHER_REQUIRED_DATE_FILTER_ID = "b69ce32d-7aee-6594-c789-2g24d4e5f691"

const requiredDateFilter: CollectionTags[number] = {
  id: REQUIRED_DATE_FILTER_ID,
  label: "Event Date",
  type: "date",
  isRequired: true,
  statusLabels: [
    { id: "ENDED", label: "Event ended" },
    { id: "ONGOING", label: "Ongoing" },
    { id: "UPCOMING", label: "Upcoming" },
  ],
}

const optionalDateFilter: CollectionTags[number] = {
  ...requiredDateFilter,
  id: OPTIONAL_DATE_FILTER_ID,
  label: "Registration Deadline",
  isRequired: false,
}

const otherRequiredDateFilter: CollectionTags[number] = {
  ...requiredDateFilter,
  id: OTHER_REQUIRED_DATE_FILTER_ID,
  label: "Booth Setup",
}

const requiredTextCategory: CollectionTags[number] = {
  id: "c70df43e-8bff-76a5-d89a-3h35e5f6g702",
  label: "Topic",
  isRequired: true,
  options: [{ id: "some-option-id", label: "Technology" }],
}

describe("validateRequiredDateFilters", () => {
  it("returns valid when there are no date filters", () => {
    const result = validateRequiredDateFilters([], undefined)

    expect(result.isValid).toBe(true)
    expect(result.unfilledRequiredDateFilters).toEqual([])
  })

  it("returns valid when no date filters are required", () => {
    const result = validateRequiredDateFilters([optionalDateFilter], undefined)

    expect(result.isValid).toBe(true)
    expect(result.unfilledRequiredDateFilters).toEqual([])
  })

  it("returns valid when a required date filter has a value", () => {
    const result = validateRequiredDateFilters(
      [requiredDateFilter],
      [{ id: REQUIRED_DATE_FILTER_ID, date: "2026-06-15" }],
    )

    expect(result.isValid).toBe(true)
    expect(result.unfilledRequiredDateFilters).toEqual([])
  })

  it("returns invalid when a required date filter has no value at all", () => {
    const result = validateRequiredDateFilters([requiredDateFilter], undefined)

    expect(result.isValid).toBe(false)
    expect(result.unfilledRequiredDateFilters).toEqual([requiredDateFilter])
  })

  it("returns invalid when the value exists but has no date filled in", () => {
    const result = validateRequiredDateFilters(
      [requiredDateFilter],
      [{ id: REQUIRED_DATE_FILTER_ID, date: "" }],
    )

    expect(result.isValid).toBe(false)
    expect(result.unfilledRequiredDateFilters).toEqual([requiredDateFilter])
  })

  it("ignores text-type tag categories entirely", () => {
    const result = validateRequiredDateFilters(
      [requiredTextCategory],
      undefined,
    )

    expect(result.isValid).toBe(true)
    expect(result.unfilledRequiredDateFilters).toEqual([])
  })

  it("returns only unfilled required date filters when multiple are configured", () => {
    const result = validateRequiredDateFilters(
      [requiredDateFilter, otherRequiredDateFilter, optionalDateFilter],
      [{ id: REQUIRED_DATE_FILTER_ID, date: "2026-06-15" }],
    )

    expect(result.isValid).toBe(false)
    expect(result.unfilledRequiredDateFilters).toEqual([
      otherRequiredDateFilter,
    ])
  })
})
