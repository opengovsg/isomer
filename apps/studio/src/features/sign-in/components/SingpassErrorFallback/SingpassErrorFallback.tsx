import type { ComponentType } from "react"
import { type FallbackProps } from "react-error-boundary"

import { FullscreenSpinner } from "~/components/FullscreenSpinner"

export const SingpassErrorFallback: ComponentType<FallbackProps> = () => {
  // NOTE: We are showing a full-screen spinner here because the callback page
  // would be redirecting the user to the actual Singpass error page
  return <FullscreenSpinner />
}
