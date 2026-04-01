import type { EnvContextReturn } from "~/components/AppProviders"
import { useContext } from "react"
import { EnvContext } from "~/components/AppProviders"

export const useEnv = (): EnvContextReturn => {
  const context = useContext(EnvContext)
  if (context === undefined) {
    throw new Error("useEnv must be used within a EnvProvider")
  }
  return context
}
