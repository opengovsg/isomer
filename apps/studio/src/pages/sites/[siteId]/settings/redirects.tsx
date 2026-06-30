import type { NextPageWithLayout } from "~/lib/types"
import { useGrowthBook } from "@growthbook/growthbook-react"
import { useRouter } from "next/router"
import { useEffect } from "react"
import { PermissionsBoundary } from "~/components/AuthWrappers"
import { siteSchema } from "~/features/editing-experience/schema"
import { RedirectsSettings } from "~/features/settings/Redirects"
import { useIsRedirectionsEnabled } from "~/hooks/useIsRedirectionsEnabled"
import { useQueryParse } from "~/hooks/useQueryParse"
import { SiteSettingsLayout } from "~/templates/layouts/SiteSettingsLayout"
import { ResourceType } from "~prisma/generated/generatedEnums"

const RedirectsSettingsPage: NextPageWithLayout = () => {
  const { siteId } = useQueryParse(siteSchema)
  const router = useRouter()
  const gb = useGrowthBook()
  const isRedirectionsEnabled = useIsRedirectionsEnabled()

  useEffect(() => {
    if (gb?.ready && !isRedirectionsEnabled) {
      void router.replace(`/sites/${siteId}/settings/agency`)
    }
  }, [gb?.ready, isRedirectionsEnabled, router, siteId])

  if (!gb?.ready || !isRedirectionsEnabled) return null

  return <RedirectsSettings siteId={Number(siteId)} />
}

RedirectsSettingsPage.getLayout = (page) => {
  return (
    <PermissionsBoundary
      resourceType={ResourceType.RootPage}
      page={SiteSettingsLayout(page)}
    />
  )
}

export default RedirectsSettingsPage
