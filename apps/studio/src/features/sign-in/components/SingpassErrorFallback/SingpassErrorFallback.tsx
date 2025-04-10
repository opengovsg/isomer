import type { ComponentType } from "react"
import { useMemo } from "react"
import { useRouter } from "next/router"
import { type FallbackProps } from "react-error-boundary"
import { z } from "zod"

import { DASHBOARD } from "~/lib/routes"
import { safeSchemaJsonParse } from "~/utils/zod"
import { SingpassErrorModal } from "./SingpassErrorModal"

export const SingpassErrorFallback: ComponentType<FallbackProps> = () => {
  const router = useRouter()
  const redirectUrl = useMemo(() => {
    const parsed = safeSchemaJsonParse(
      z.object({
        landingUrl: z.string(),
      }),
      String(router.query.state),
    )
    if (parsed.success) {
      return parsed.data.landingUrl
    }
    return DASHBOARD
  }, [router.query.state])

  return <SingpassErrorModal redirectUrl={redirectUrl} />
}
