import type { CSSProperties } from "react"
import { useMemo } from "react"
import { flatten } from "flat"

import { convertThemeToCss } from "~/features/settings/utils"
import { trpc } from "~/utils/trpc"

export const useSiteThemeCssVars = ({ siteId }: { siteId: number }) => {
  const [theme] = trpc.site.getTheme.useSuspenseQuery({ id: siteId })
  const themeCssVars = useMemo(() => {
    if (!theme) return
    // convert theme to css vars
    return convertThemeToCss(theme)
  }, [theme])

  return themeCssVars
}
