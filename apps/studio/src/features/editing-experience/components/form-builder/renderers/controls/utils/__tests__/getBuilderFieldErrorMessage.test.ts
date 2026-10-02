import { getBuilderFieldErrorMessage } from "../getBuilderFieldErrorMessage"

describe("getBuilderFieldErrorMessage", () => {
  it("returns pattern errors on the field instance path", () => {
    const actual = getBuilderFieldErrorMessage("quickActionsItems.0.title", {
      "/quickActionsItems/0/title": [
        {
          instancePath: "/quickActionsItems/0/title",
          keyword: "errorMessage",
          message: "cannot be empty or contain only spaces",
          schemaPath: "",
          params: {},
        },
      ],
    })

    expect(actual).toBe("cannot be empty or contain only spaces")
  })

  it("returns required errors attached to the parent object path", () => {
    const actual = getBuilderFieldErrorMessage("quickActionsItems.0.title", {
      "/quickActionsItems/0": [
        {
          instancePath: "/quickActionsItems/0",
          keyword: "required",
          message: "must have required property 'title'",
          schemaPath: "",
          params: { missingProperty: "title" },
        },
      ],
    })

    expect(actual).toBe("must have required property 'title'")
  })
})
