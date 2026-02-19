import type { IsomerSiteProps } from "~/types"
import { Wogaa } from "~/templates/next/components/internal/Wogaa"

interface RenderApplicationHeadScriptsProps {
  site: Pick<IsomerSiteProps, "environment">
}

export const RenderApplicationHeadScripts = ({
  site,
}: RenderApplicationHeadScriptsProps) => {
  return (
    <>
      {/* NOTE: we load in WOGAA regardless of whether the site is  */}
      {/* a government site as WOGAA still requires the agency to register their site */}
      {/* and WOGAA is still gated behind techpass login. */}
      {/* Additionally, WOGAA will still load but not track metrics if the site  */}
      {/* is not registered, so no end impact to user */}
      <Wogaa environment={site.environment} />
    </>
  )
}
