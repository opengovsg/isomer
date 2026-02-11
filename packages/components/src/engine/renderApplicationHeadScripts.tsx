import type { IsomerSiteProps } from "~/types"
import { Wogaa } from "~/templates/next/components/internal/Wogaa"

interface RenderApplicationHeadScriptsProps {
  site: IsomerSiteProps
}

export const RenderApplicationHeadScripts = ({
  site,
}: RenderApplicationHeadScriptsProps) => {
  return (
    <>
      {/* NOTE: we load in wogaa regardless of whether the site is  */}
      {/* a government site as wogaa still requires the agency to register their site */}
      {/* and wogaa is still gated behind techpass login. */}
      {/* Additionally, wogaa will still load but not track metrics if the site  */}
      {/* is not registered, so no end impact to user */}
      <Wogaa environment={site.environment} />
    </>
  )
}
