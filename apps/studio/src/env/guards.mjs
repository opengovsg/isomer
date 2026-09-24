/**
 * @param {string} key
 * @param {Record<string, unknown> | null | undefined} storybookInjectedEnv
 * @param {Record<string, string | undefined>} processEnv
 */
export const readProcessEnv = (key, storybookInjectedEnv, processEnv) => {
  if (
    storybookInjectedEnv &&
    Object.prototype.hasOwnProperty.call(storybookInjectedEnv, key)
  ) {
    const value = storybookInjectedEnv[key]
    if (value === undefined || value === null) return undefined
    return String(value)
  }
  return processEnv[key]
}

/**
 * Boot-time security invariants run after schema validation (server only).
 *
 * @param {Record<string, unknown>} env
 */
export const assertStudioEnvSecurityInvariants = (env) => {
  const r2Vars = [
    env.R2_ACCOUNT_ID,
    env.R2_ACCESS_KEY_ID,
    env.R2_SECRET_ACCESS_KEY,
  ]
  if (r2Vars.some(Boolean) && !r2Vars.every(Boolean)) {
    throw new Error(
      "R2_ACCOUNT_ID, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY must be set together",
    )
  }
  if (env.NEXT_PUBLIC_APP_ENV !== "preview" && env.DANGEROUSLY_SET_STATIC_OTP) {
    throw new Error(
      "DANGEROUSLY_SET_STATIC_OTP may only be set in preview environments",
    )
  }
  if (
    env.NEXT_PUBLIC_APP_ENV !== "preview" &&
    env.NEXT_PUBLIC_DANGEROUSLY_SKIP_SINGPASS
  ) {
    throw new Error(
      "NEXT_PUBLIC_DANGEROUSLY_SKIP_SINGPASS may only be set in preview environments",
    )
  }
}
