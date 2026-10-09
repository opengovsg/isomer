import { getBuilderFieldErrorMessage } from "../getBuilderFieldErrorMessage"

describe("getBuilderFieldErrorMessage", () => {
  it("returns pattern errors on the field instance path", () => {
    // Arrange
    const errors = {
      "/quickActionsItems/0/title": [
        {
          instancePath: "/quickActionsItems/0/title",
          keyword: "errorMessage",
          message: "cannot be empty or contain only spaces",
          schemaPath: "",
          params: {},
        },
      ],
    }

    // Act
    const actual = getBuilderFieldErrorMessage(
      "quickActionsItems.0.title",
      errors,
    )

    // Assert
    expect(actual).toBe("cannot be empty or contain only spaces")
  })

  it("returns required errors attached to the parent object path", () => {
    // Arrange
    const errors = {
      "/quickActionsItems/0": [
        {
          instancePath: "/quickActionsItems/0",
          keyword: "required",
          message: "must have required property 'title'",
          schemaPath: "",
          params: { missingProperty: "title" },
        },
      ],
    }

    // Act
    const actual = getBuilderFieldErrorMessage(
      "quickActionsItems.0.title",
      errors,
    )

    // Assert
    expect(actual).toBe("must have required property 'title'")
  })
})
