import type { ErrorObject } from "ajv"
import { describe, expect, it } from "vitest"

import { getUniqueErrorMessages } from "../utils"

const createError = (message?: string): ErrorObject =>
  ({
    keyword: "maxItems",
    instancePath: "/items",
    schemaPath: "#/properties/items/maxItems",
    params: {},
    message,
  }) as ErrorObject

describe("getUniqueErrorMessages", () => {
  it("should return an empty array when there are no errors", () => {
    // Arrange
    const errors = {}

    // Act
    const actual = getUniqueErrorMessages(errors)

    // Assert
    expect(actual).toStrictEqual([])
  })

  it("should flatten error messages across multiple instance paths", () => {
    // Arrange
    const errors = {
      "/items": [createError("You can only have up to 8 first-level links.")],
      "/items/0/url": [createError('must match format "link"')],
    }

    // Act
    const actual = getUniqueErrorMessages(errors)

    // Assert
    expect(actual).toStrictEqual([
      "You can only have up to 8 first-level links.",
      'must match format "link"',
    ])
  })

  it("should dedupe identical error messages", () => {
    // Arrange
    const message = "You can only have up to 8 first-level links."
    const errors = {
      "/items": [createError(message), createError(message)],
    }

    // Act
    const actual = getUniqueErrorMessages(errors)

    // Assert
    expect(actual).toStrictEqual([message])
  })

  it("should filter out errors with no message", () => {
    // Arrange
    const errors = {
      "/items": [createError(undefined), createError("has a message")],
    }

    // Act
    const actual = getUniqueErrorMessages(errors)

    // Assert
    expect(actual).toStrictEqual(["has a message"])
  })
})
