/**
 * Opt-in logging for DGS network usage (set NEXT_PUBLIC_ISOMER_DEBUG_DGS=1).
 * Use during next build / prerender to confirm whether fetch runs on the server
 * or only after hydration in the browser.
 */
const isDgsDebugEnabled = (): boolean => {
  if (typeof process === "undefined") return false
  return process.env.NEXT_PUBLIC_ISOMER_DEBUG_DGS === "1"
}

export const logDgsDebug = (
  message: string,
  context?: Record<string, unknown>,
): void => {
  if (!isDgsDebugEnabled()) return

  const env =
    typeof process !== "undefined"
      ? {
          nextPhase: process.env.NEXT_PHASE,
          nodeEnv: process.env.NODE_ENV,
        }
      : {}

  console.warn(`[Isomer][DGS][debug] ${message}`, {
    hasWindow: typeof window !== "undefined",
    ...env,
    ...context,
  })
}
