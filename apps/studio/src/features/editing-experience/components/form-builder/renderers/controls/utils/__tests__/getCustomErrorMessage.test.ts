import { getCustomErrorMessage } from "../getCustomErrorMessage"

describe("getCustomErrorMessage", () => {
  it("should return 'cannot be empty' when error is 'is a required property'", () => {
    expect(getCustomErrorMessage("is a required property")).toBe(
      "cannot be empty",
    )
  })

  it("should return empty string when error is undefined", () => {
    expect(getCustomErrorMessage(undefined)).toBe("")
  })

  it("should return the original error message for other errors", () => {
    const error = "some other error"
    expect(getCustomErrorMessage(error)).toBe(error)
  })
})
