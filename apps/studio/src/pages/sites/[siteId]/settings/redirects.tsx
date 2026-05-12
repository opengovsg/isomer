import type { NextPageWithLayout } from "~/lib/types"
import { Center, Text } from "@chakra-ui/react"
import { useRouter } from "next/router"
import { useEffect } from "react"
import { PermissionsBoundary } from "~/components/AuthWrappers"
import { siteSchema } from "~/features/editing-experience/schema"
import { useIsRedirectionsEnabled } from "~/hooks/useIsRedirectionsEnabled"
import { useQueryParse } from "~/hooks/useQueryParse"
import { SiteSettingsLayout } from "~/templates/layouts/SiteSettingsLayout"
import { ResourceType } from "~prisma/generated/generatedEnums"

const RedirectsSettingsPage: NextPageWithLayout = () => {
  const { siteId } = useQueryParse(siteSchema)
  const router = useRouter()
  const isRedirectionsEnabled = useIsRedirectionsEnabled()

  useEffect(() => {
    if (!isRedirectionsEnabled) {
      void router.replace(`/sites/${siteId}/settings/agency`)
    }
  }, [isRedirectionsEnabled, router, siteId])

  if (!isRedirectionsEnabled) return null

  return (
    <Center flex={1}>
      <Text textStyle="h5" color="base.content.medium">
        Redirects — coming soon
      </Text>
    </Center>
  )
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
