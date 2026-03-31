import type { ComponentType } from "react"
import { useRouter } from "next/router"
import { useEffect } from "react"
import { type FallbackProps } from "react-error-boundary"
import { FullscreenSpinner } from "~/components/FullscreenSpinner"
import { SIGN_IN } from "~/lib/routes"

export const SingpassErrorFallback: ComponentType<FallbackProps> = () => {
  const router = useRouter()

  useEffect(() => {
    void router.replace(
      `${SIGN_IN}?error=${encodeURIComponent("Unable to match Singpass profile")}`,
    )
  }, [router])

  // NOTE: We are showing a full-screen spinner here because the callback page
  // would be redirecting the user to the actual Singpass error page
  return <FullscreenSpinner />
}
