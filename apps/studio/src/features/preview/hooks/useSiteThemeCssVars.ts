import type { CSSProperties } from "react"
import { useMemo } from "react"
import { flatten } from "flat"

import { trpc } from "~/utils/trpc"

export const useSiteThemeCssVars = ({ siteId }: { siteId: number }) => {
  const [theme] = trpc.site.getTheme.useSuspenseQuery({ id: siteId })
  const themeCssVars = useMemo(() => {
    if (!theme) return
    // convert theme to css vars
    const flattenedVars: Record<string, string> = flatten(
      { color: { brand: { ...theme.colors } } },
      { delimiter: "-" },
    )
    return Object.entries(flattenedVars).reduce(
      (acc, [key, value]) => {
        acc[`--${key}`] = value
        return acc
      },
      {} as Record<string, string>,
    ) as CSSProperties
  }, [theme])

  return themeCssVars
}
