import {
  DUPLICATE_FILTER_LABEL_MESSAGE,
  DUPLICATE_OPTION_LABEL_MESSAGE,
} from "../../../../utils/formBuilderJsonFormsCore"
import { getCustomErrorMessage } from "../getCustomErrorMessage"

describe("getCustomErrorMessage", () => {
  it("should return 'cannot be empty' when error is 'is a required property'", () => {
    // Arrange
    const params = { error: "is a required property" }

    // Act
    const result = getCustomErrorMessage(params)

    // Assert
    expect(result).toBe("cannot be empty")
  })

  it("should return 'is not in the correct format' when error starts with 'must match pattern'", () => {
    // Arrange
    const params = { error: "must match pattern ^https?://" }

    // Act
    const result = getCustomErrorMessage(params)

    // Assert
    expect(result).toBe("is not in the correct format")
  })

  it("should return empty string when error is undefined", () => {
    // Arrange
    const params = { error: undefined }

    // Act
    const result = getCustomErrorMessage(params)

    // Assert
    expect(result).toBe("")
  })

  it("should return the original error message for other errors", () => {
    // Arrange
    const error = "some other error"
    const params = { error }

    // Act
    const result = getCustomErrorMessage(params)

    // Assert
    expect(result).toBe(error)
  })

  it("omits field label for standalone duplicate option/filter messages", () => {
    // Arrange
    const optionParams = {
      error: DUPLICATE_OPTION_LABEL_MESSAGE,
      fieldLabel: "Option name",
    }
    const filterParams = {
      error: DUPLICATE_FILTER_LABEL_MESSAGE,
      fieldLabel: "Filter name",
    }

    // Act
    const optionResult = getCustomErrorMessage(optionParams)
    const filterResult = getCustomErrorMessage(filterParams)

    // Assert
    expect(optionResult).toBe(DUPLICATE_OPTION_LABEL_MESSAGE)
    expect(filterResult).toBe(DUPLICATE_FILTER_LABEL_MESSAGE)
  })

  it("prefixes label when fieldLabel is set and message is not standalone", () => {
    // Arrange
    const params = {
      error: "is a required property",
      fieldLabel: "Title",
    }

    // Act
    const result = getCustomErrorMessage(params)

    // Assert
    expect(result).toBe("Title cannot be empty")
  })
})
