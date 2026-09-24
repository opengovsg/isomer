import { afterEach, describe, expect, it, vi } from "vitest"

describe("env.mjs security invariants", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  async function importEnvModule() {
    return import("~/env.mjs")
  }

  it("rejects partial R2 credentials", async () => {
    vi.stubEnv("R2_ACCOUNT_ID", "acct-id")

    await expect(importEnvModule()).rejects.toThrow(
      /R2_ACCOUNT_ID, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY must be set together/,
    )
  })

  it("rejects DANGEROUSLY_SET_STATIC_OTP outside preview", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "development")
    vi.stubEnv("DANGEROUSLY_SET_STATIC_OTP", "123456")

    await expect(importEnvModule()).rejects.toThrow(
      /DANGEROUSLY_SET_STATIC_OTP may only be set in preview environments/,
    )
  })

  it("rejects NEXT_PUBLIC_DANGEROUSLY_SKIP_SINGPASS outside preview", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "staging")
    vi.stubEnv("NEXT_PUBLIC_DANGEROUSLY_SKIP_SINGPASS", "true")

    await expect(importEnvModule()).rejects.toThrow(
      /NEXT_PUBLIC_DANGEROUSLY_SKIP_SINGPASS may only be set in preview environments/,
    )
  })

  it("accepts preview auth bypass flags when configured together", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "preview")
    vi.stubEnv("DANGEROUSLY_SET_STATIC_OTP", "123456")
    vi.stubEnv("NEXT_PUBLIC_DANGEROUSLY_SKIP_SINGPASS", "true")

    const { env } = await importEnvModule()

    expect(env.NEXT_PUBLIC_APP_ENV).toBe("preview")
    expect(env.DANGEROUSLY_SET_STATIC_OTP).toBe("123456")
    expect(env.NEXT_PUBLIC_DANGEROUSLY_SKIP_SINGPASS).toBe(true)
  })

  it("accepts a full R2 credential set", async () => {
    vi.stubEnv("R2_ACCOUNT_ID", "acct")
    vi.stubEnv("R2_ACCESS_KEY_ID", "key")
    vi.stubEnv("R2_SECRET_ACCESS_KEY", "secret")

    const { env } = await importEnvModule()

    expect(env.R2_ACCOUNT_ID).toBe("acct")
    expect(env.R2_ACCESS_KEY_ID).toBe("key")
    expect(env.R2_SECRET_ACCESS_KEY).toBe("secret")
  })

  it("reads client env from STORYBOOK_ENVIRONMENT when STORYBOOK is set", async () => {
    vi.stubEnv("STORYBOOK", "true")
    vi.stubEnv("SKIP_ENV_VALIDATION", "true")
    vi.stubEnv(
      "STORYBOOK_ENVIRONMENT",
      JSON.stringify({
        NEXT_PUBLIC_APP_NAME: "Storybook Site Name",
        NEXT_PUBLIC_APP_ENV: "development",
      }),
    )

    const { env } = await importEnvModule()

    expect(env.NEXT_PUBLIC_APP_NAME).toBe("Storybook Site Name")
    expect(env.NEXT_PUBLIC_APP_ENV).toBe("development")
  })
})
