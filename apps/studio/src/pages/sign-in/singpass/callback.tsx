import { withErrorBoundary } from "react-error-boundary"

import { FullscreenSpinner } from "~/components/FullscreenSpinner"
import { SingpassCallback } from "~/features/sign-in/components"
import { SgidErrorFallback } from "~/features/sign-in/components/SgidErrorFallback/SgidErrorFallback"
import { withSuspense } from "~/hocs/withSuspense"

const SingpassCallbackPage = withErrorBoundary(
  withSuspense(SingpassCallback, <FullscreenSpinner />),
  // TODO: Replace fallback component with Singpass-specific error fallback
  { FallbackComponent: SgidErrorFallback },
)

export default SingpassCallbackPage
