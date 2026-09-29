import { ISOMER_SUPPORT_EMAIL } from "~/constants/misc"
import { env } from "~/env.mjs"
import { getBaseUrl } from "~/utils/getBaseUrl"

import { getEnvironmentLabel } from "../layout"
import { templates } from "../templates"

describe("otpTemplate", () => {
  const mockData = {
    recipientEmail: "test@example.com",
    otpPrefix: "MZS",
    token: "JHDZRB",
    expiryMinutes: 10,
  }

  it("uses the environment label in the subject and never the token", () => {
    const { subject } = templates.otp(mockData)

    expect(subject).toBe(`Your Isomer Studio${getEnvironmentLabel()} OTP`)
    expect(subject).not.toContain(mockData.token)
  })

  it("shows the prefix and the code in separate cells", () => {
    const { body } = templates.otp(mockData)

    expect(body).toContain(`>MZS&nbsp;&ndash;</td>`)
    // The code cell holds only the code so selecting it copies nothing else
    expect(body).toMatch(/class="code-box"[^>]*>JHDZRB<\/td>/)
    expect(body).not.toContain("MZS-JHDZRB")
  })

  it("shows the expiry, the anti-phishing callout and the support contact", () => {
    const { body } = templates.otp(mockData)

    expect(body).toContain("expires in <b>10 minutes</b>")
    expect(body).toContain("Requesting a new OTP will cancel this one.")
    expect(body).toContain("The Isomer team will never ask for it.")
    expect(body).toContain(ISOMER_SUPPORT_EMAIL)
    expect(body).toContain(
      "This is an auto-generated message. Please do not reply to this email.",
    )
  })

  it("links to the sending deployment with the host as the link text", () => {
    const { body } = templates.otp(mockData)
    const url = new URL(getBaseUrl())

    expect(body).toMatch(
      new RegExp(`<a href="${url.origin}"[^>]*>${url.host}</a>`),
    )
  })

  it("puts the reference and expiry in the preview text", () => {
    const { body } = templates.otp(mockData)

    expect(body).toContain("Reference MZS &middot; expires in 10 minutes")
  })

  it("has no greeting or sign-off", () => {
    const { body } = templates.otp(mockData)

    expect(body).not.toContain("Hi test@example.com")
    expect(body).not.toContain("Isomer team</p>")
  })

  it("escapes the template arguments", () => {
    const { body } = templates.otp({ ...mockData, otpPrefix: "<b>" })

    expect(body).toContain("&lt;b&gt;&nbsp;&ndash;")
  })
})

describe("getEnvironmentLabel", () => {
  it("is empty in production and bracketed elsewhere", () => {
    const appEnv = env.NEXT_PUBLIC_APP_ENV
    const label = getEnvironmentLabel()

    if (appEnv === "production") {
      expect(label).toBe("")
    } else {
      expect(label).toMatch(/^ \([A-Z].*\)$/)
    }
  })
})
