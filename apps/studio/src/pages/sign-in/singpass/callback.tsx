import { withErrorBoundary } from "react-error-boundary"

import { FullscreenSpinner } from "~/components/FullscreenSpinner"
import { SingpassCallback } from "~/features/sign-in/components"
import { SingpassErrorFallback } from "~/features/sign-in/components/SingpassErrorFallback/SingpassErrorFallback"
import { withSuspense } from "~/hocs/withSuspense"

const SingpassCallbackPage = withErrorBoundary(
  withSuspense(SingpassCallback, <FullscreenSpinner />),
  // TODO: Replace fallback component with Singpass-specific error fallback
  { FallbackComponent: SingpassErrorFallback },
)

export default SingpassCallbackPage
