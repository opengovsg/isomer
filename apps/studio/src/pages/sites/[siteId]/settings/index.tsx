import type { NextPageWithLayout } from "~/lib/types"
import { ResourceType } from "@prisma/client"
import { useRouter } from "next/router"
import { useEffect } from "react"
import { z } from "zod"
import { PermissionsBoundary } from "~/components/AuthWrappers"
import { FullscreenSpinner } from "~/components/FullscreenSpinner"
import { useQueryParse } from "~/hooks/useQueryParse"
import { SiteBasicLayout } from "~/templates/layouts/SiteBasicLayout"

const siteSettingsSchema = z.object({
  siteId: z.coerce.number(),
})

const SiteSettingsPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { siteId } = useQueryParse(siteSettingsSchema)

  useEffect(() => {
    void router.replace(`/sites/${siteId}/settings/agency`)
  }, [router, siteId])

  return <FullscreenSpinner />
}

SiteSettingsPage.getLayout = (page) => {
  return (
    <PermissionsBoundary
      resourceType={ResourceType.RootPage}
      page={SiteBasicLayout(page)}
    />
  )
}

export default SiteSettingsPage
