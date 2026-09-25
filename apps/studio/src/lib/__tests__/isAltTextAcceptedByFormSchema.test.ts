import { isAltTextAcceptedByFormSchema } from "../isAltTextAcceptedByFormSchema"

describe("isAltTextAcceptedByFormSchema", () => {
  it("accepts descriptive alt text", () => {
    // Arrange / Act / Assert
    expect(isAltTextAcceptedByFormSchema("A red bus at a stop.")).toBe(true)
  })

  it("rejects generic terms the form schema blocks", () => {
    // Arrange / Act / Assert
    expect(isAltTextAcceptedByFormSchema("chart")).toBe(false)
  })
})
