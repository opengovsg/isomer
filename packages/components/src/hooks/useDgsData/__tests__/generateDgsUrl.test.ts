import { describe, expect, it } from "vitest"

import type { DgsApiDatasetSearchParams } from "../types"
import { generateDgsUrl } from "../generateDgsUrl"

describe("generateDgsUrl", () => {
  it("should generate URL with only required resourceId", () => {
    // Arrange
    const params: DgsApiDatasetSearchParams = {
      resourceId: "test-resource-123",
    }

    // Act
    const result = generateDgsUrl(params)

    // Assert
    expect(result).toBe(
      "https://data.gov.sg/api/action/datastore_search?resource_id=test-resource-123",
    )
  })

  it("should generate URL with all optional parameters", () => {
    // Arrange
    const params: DgsApiDatasetSearchParams = {
      resourceId: "test-resource-123",
      limit: 10,
      offset: 20,
      fields: "field1,field2,field3",
      filters: {
        category: "transport",
        year: "2023",
      },
      sort: "field4 desc",
    }

    // Act
    const result = generateDgsUrl(params)

    // Assert
    expect(result).toBe(
      "https://data.gov.sg/api/action/datastore_search?resource_id=test-resource-123&limit=10&offset=20&fields=field1%2Cfield2%2Cfield3&filters=%7B%22category%22%3A%22transport%22%2C%22year%22%3A%222023%22%7D&sort=field4+desc",
    )
  })

  it("should handle numeric limit and offset", () => {
    // Arrange
    const params: DgsApiDatasetSearchParams = {
      resourceId: "test-resource-123",
      limit: 50,
      offset: 100,
    }

    // Act
    const result = generateDgsUrl(params)

    // Assert
    expect(result).toBe(
      "https://data.gov.sg/api/action/datastore_search?resource_id=test-resource-123&limit=50&offset=100",
    )
  })

  it("should handle empty filters object", () => {
    // Arrange
    const params: DgsApiDatasetSearchParams = {
      resourceId: "test-resource-123",
      filters: {},
    }

    // Act
    const result = generateDgsUrl(params)

    // Assert
    expect(result).toBe(
      "https://data.gov.sg/api/action/datastore_search?resource_id=test-resource-123",
    )
  })

  it("should handle complex filters with special characters", () => {
    // Arrange
    const params: DgsApiDatasetSearchParams = {
      resourceId: "test-resource-123",
      filters: {
        location: "Singapore & Malaysia",
        category: "transport & logistics",
        status: "active",
      },
    }

    // Act
    const result = generateDgsUrl(params)

    // Assert
    expect(result).toBe(
      "https://data.gov.sg/api/action/datastore_search?resource_id=test-resource-123&filters=%7B%22location%22%3A%22Singapore+%26+Malaysia%22%2C%22category%22%3A%22transport+%26+logistics%22%2C%22status%22%3A%22active%22%7D",
    )
  })

  it("should handle fields with spaces and special characters", () => {
    // Arrange
    const params: DgsApiDatasetSearchParams = {
      resourceId: "test-resource-123",
      fields: "field 1,field-2,field_3",
    }

    // Act
    const result = generateDgsUrl(params)

    // Assert
    expect(result).toBe(
      "https://data.gov.sg/api/action/datastore_search?resource_id=test-resource-123&fields=field+1%2Cfield-2%2Cfield_3",
    )
  })

  it("should handle sort parameter with spaces", () => {
    // Arrange
    const params: DgsApiDatasetSearchParams = {
      resourceId: "test-resource-123",
      sort: "date desc, name asc",
    }

    // Act
    const result = generateDgsUrl(params)

    // Assert
    expect(result).toBe(
      "https://data.gov.sg/api/action/datastore_search?resource_id=test-resource-123&sort=date+desc%2C+name+asc",
    )
  })

  it("should handle zero values for limit and offset", () => {
    // Arrange
    const params: DgsApiDatasetSearchParams = {
      resourceId: "test-resource-123",
      limit: 0,
      offset: 0,
    }

    // Act
    const result = generateDgsUrl(params)

    // Assert
    expect(result).toBe(
      "https://data.gov.sg/api/action/datastore_search?resource_id=test-resource-123",
    )
  })

  it("should handle resourceId with special characters", () => {
    // Arrange
    const params: DgsApiDatasetSearchParams = {
      resourceId: "test-resource-123_abc-def",
    }

    // Act
    const result = generateDgsUrl(params)

    // Assert
    expect(result).toBe(
      "https://data.gov.sg/api/action/datastore_search?resource_id=test-resource-123_abc-def",
    )
  })

  it("should not include undefined optional parameters", () => {
    // Arrange
    const params: DgsApiDatasetSearchParams = {
      resourceId: "test-resource-123",
      limit: undefined,
      offset: undefined,
      fields: undefined,
      filters: undefined,
      sort: undefined,
    }

    // Act
    const result = generateDgsUrl(params)

    // Assert
    expect(result).toBe(
      "https://data.gov.sg/api/action/datastore_search?resource_id=test-resource-123",
    )
  })

  it("should handle filters with numeric values", () => {
    // Arrange
    const params: DgsApiDatasetSearchParams = {
      resourceId: "test-resource-123",
      filters: {
        year: "2023",
        count: "100",
        active: "true",
      },
    }

    // Act
    const result = generateDgsUrl(params)

    // Assert
    expect(result).toBe(
      "https://data.gov.sg/api/action/datastore_search?resource_id=test-resource-123&filters=%7B%22year%22%3A%222023%22%2C%22count%22%3A%22100%22%2C%22active%22%3A%22true%22%7D",
    )
  })
})
