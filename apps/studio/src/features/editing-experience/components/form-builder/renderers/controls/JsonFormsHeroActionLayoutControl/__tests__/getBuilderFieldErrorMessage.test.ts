import { getBuilderFieldErrorMessage } from "../getBuilderFieldErrorMessage"

describe("getBuilderFieldErrorMessage", () => {
  it("returns pattern errors on the field instance path", () => {
    // Arrange
    const errors = {
      "/actions/items/0/title": [
        {
          instancePath: "/actions/items/0/title",
          keyword: "errorMessage",
          message: "cannot be empty or contain only spaces",
          schemaPath: "",
          params: {},
        },
      ],
    }

    // Act
    const actual = getBuilderFieldErrorMessage("actions.items.0.title", errors)

    // Assert
    expect(actual).toBe("cannot be empty or contain only spaces")
  })

  it("returns pattern errors on quick link destination paths", () => {
    // Arrange
    const errors = {
      "/actions/items/0/buttonUrl": [
        {
          instancePath: "/actions/items/0/buttonUrl",
          keyword: "pattern",
          message: 'must match pattern "..."',
          schemaPath: "",
          params: {},
        },
      ],
    }

    // Act
    const actual = getBuilderFieldErrorMessage(
      "actions.items.0.buttonUrl",
      errors,
    )

    // Assert
    expect(actual).toBe('must match pattern "..."')
  })

  it("returns required errors attached to the parent object path", () => {
    // Arrange
    const errors = {
      "/actions/items/0": [
        {
          instancePath: "/actions/items/0",
          keyword: "required",
          message: "must have required property 'title'",
          schemaPath: "",
          params: { missingProperty: "title" },
        },
      ],
    }

    // Act
    const actual = getBuilderFieldErrorMessage("actions.items.0.title", errors)

    // Assert
    expect(actual).toBe("cannot be empty")
  })

  it("reports one required message when every union branch is missing the field", () => {
    // Arrange
    const requiredError = {
      instancePath: "",
      keyword: "required",
      message: "must have required property 'title'",
      schemaPath: "",
      params: { missingProperty: "title" },
    }
    const errors = {
      "": Array.from({ length: 5 }, () => requiredError),
    }

    // Act
    const actual = getBuilderFieldErrorMessage("title", errors)

    // Assert
    expect(actual).toBe("cannot be empty")
  })
})
