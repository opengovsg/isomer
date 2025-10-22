import { useRouter } from "next/router"
import { z } from "zod"

import { FullscreenSpinner } from "~/components/FullscreenSpinner"
import { useQueryParse } from "~/hooks/useQueryParse"
import { type NextPageWithLayout } from "~/lib/types"

const siteSettingsSchema = z.object({
  siteId: z.coerce.number(),
})

const SiteSettingsPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { siteId } = useQueryParse(siteSettingsSchema)
  void router.replace(`sites/${siteId}/settings/agency`)

  return <FullscreenSpinner />
}

export default SiteSettingsPage
