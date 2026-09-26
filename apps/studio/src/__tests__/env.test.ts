import { describe, expect, it } from "vitest"
import {
  assertStudioEnvSecurityInvariants,
  readProcessEnv,
} from "~/env/guards.mjs"

describe("assertStudioEnvSecurityInvariants", () => {
  const baseEnv = {
    NEXT_PUBLIC_APP_ENV: "test",
    R2_ACCOUNT_ID: undefined,
    R2_ACCESS_KEY_ID: undefined,
    R2_SECRET_ACCESS_KEY: undefined,
    DANGEROUSLY_SET_STATIC_OTP: undefined,
    NEXT_PUBLIC_DANGEROUSLY_SKIP_SINGPASS: false,
  }

  it("rejects partial R2 credentials", () => {
    // Arrange
    const env = { ...baseEnv, R2_ACCOUNT_ID: "acct-id" }

    // Act / Assert
    expect(() => assertStudioEnvSecurityInvariants(env)).toThrow(
      /R2_ACCOUNT_ID, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY must be set together/,
    )
  })

  it("rejects DANGEROUSLY_SET_STATIC_OTP outside preview", () => {
    // Arrange
    const env = {
      ...baseEnv,
      NEXT_PUBLIC_APP_ENV: "development",
      DANGEROUSLY_SET_STATIC_OTP: "123456",
    }

    // Act / Assert
    expect(() => assertStudioEnvSecurityInvariants(env)).toThrow(
      /DANGEROUSLY_SET_STATIC_OTP may only be set in preview environments/,
    )
  })

  it("rejects NEXT_PUBLIC_DANGEROUSLY_SKIP_SINGPASS outside preview", () => {
    // Arrange
    const env = {
      ...baseEnv,
      NEXT_PUBLIC_APP_ENV: "staging",
      NEXT_PUBLIC_DANGEROUSLY_SKIP_SINGPASS: true,
    }

    // Act / Assert
    expect(() => assertStudioEnvSecurityInvariants(env)).toThrow(
      /NEXT_PUBLIC_DANGEROUSLY_SKIP_SINGPASS may only be set in preview environments/,
    )
  })

  it("accepts preview auth bypass flags when configured together", () => {
    // Arrange
    const env = {
      ...baseEnv,
      NEXT_PUBLIC_APP_ENV: "preview",
      DANGEROUSLY_SET_STATIC_OTP: "123456",
      NEXT_PUBLIC_DANGEROUSLY_SKIP_SINGPASS: true,
    }

    // Act / Assert
    expect(() => assertStudioEnvSecurityInvariants(env)).not.toThrow()
  })

  it("accepts a full R2 credential set", () => {
    // Arrange
    const env = {
      ...baseEnv,
      R2_ACCOUNT_ID: "acct",
      R2_ACCESS_KEY_ID: "key",
      R2_SECRET_ACCESS_KEY: "secret",
    }

    // Act / Assert
    expect(() => assertStudioEnvSecurityInvariants(env)).not.toThrow()
  })
})

describe("readProcessEnv", () => {
  it("reads client env from STORYBOOK_ENVIRONMENT when present", () => {
    // Arrange
    const storybookInjectedEnv = {
      NEXT_PUBLIC_APP_NAME: "Storybook Site Name",
      NEXT_PUBLIC_APP_ENV: "development",
    }

    // Act / Assert
    expect(
      readProcessEnv("NEXT_PUBLIC_APP_NAME", storybookInjectedEnv, {}),
    ).toBe("Storybook Site Name")
    expect(
      readProcessEnv("NEXT_PUBLIC_APP_ENV", storybookInjectedEnv, {}),
    ).toBe("development")
  })
})
