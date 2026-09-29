import { normaliseOtpInput } from "../normaliseOtpInput"

describe("normaliseOtpInput", () => {
  it("leaves a plain code unchanged", () => {
    expect(normaliseOtpInput("JHDZRB")).toBe("JHDZRB")
  })

  it("uppercases input", () => {
    expect(normaliseOtpInput("jhdzrb")).toBe("JHDZRB")
  })

  it("strips a pasted prefix and hyphen", () => {
    expect(normaliseOtpInput("MZS-JHDZRB")).toBe("JHDZRB")
  })

  it("strips the prefix as shown in the email (non-breaking space and en dash)", () => {
    expect(normaliseOtpInput("MZS – JHDZRB")).toBe("JHDZRB")
  })

  it("strips surrounding and inner whitespace, including zero-width characters", () => {
    expect(normaliseOtpInput("  JHD ZRB​\n")).toBe("JHDZRB")
  })

  it("strips a prefix from an older email too, so the server can reject it", () => {
    expect(normaliseOtpInput("NWY-JHDZRB")).toBe("JHDZRB")
  })

  it("does not strip letters from a code that starts with letters", () => {
    expect(normaliseOtpInput("ABC234")).toBe("ABC234")
  })

  it("keeps characters outside the OTP alphabet so mistakes stay visible", () => {
    expect(normaliseOtpInput("J0DZRB")).toBe("J0DZRB")
  })

  it("keeps partial input while the user is typing", () => {
    expect(normaliseOtpInput("JHD")).toBe("JHD")
  })

  it("caps the result at the OTP length", () => {
    expect(normaliseOtpInput("JHDZRBX")).toBe("JHDZRB")
  })
})
