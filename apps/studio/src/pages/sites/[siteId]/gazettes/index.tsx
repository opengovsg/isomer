import { Center, Text, useDisclosure, Link, VStack } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { useRouter } from "next/router"
import { Suspense, useEffect } from "react"
import { BiData, BiPlus } from "react-icons/bi"
import { z } from "zod"
import { PermissionsBoundary } from "~/components/AuthWrappers"
import { ISOMER_SUPPORT_LINK } from "~/constants/misc"
import { TOPPAN_EMAIL_DOMAIN } from "~/constants/toppan"
import { DashboardLayout } from "~/features/dashboard/components/DashboardLayout"
import {
  CreateGazetteModal,
  GazetteSubcategoriesProvider,
  GazetteTable,
} from "~/features/gazettes"
import { useMe } from "~/features/me/api/useMe"
import { useEgazetteInfo } from "~/hooks/useEgazetteInfo"
import { useIsUserIsomerAdmin } from "~/hooks/useIsUserIsomerAdmin"
import { useQueryParse } from "~/hooks/useQueryParse"
import { type NextPageWithLayout } from "~/lib/types"
import { SiteMinimalLayout } from "~/templates/layouts/SiteMinimalLayout"
import { IsomerAdminRole, ResourceType } from "~prisma/generated/generatedEnums"

export const gazettePageSchema = z.object({
  siteId: z.coerce.number(),
})

const GazettesPage: NextPageWithLayout = () => {
  const { siteId } = useQueryParse(gazettePageSchema)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { me } = useMe()
  const router = useRouter()
  const { isAdmin: isIsomerAdmin, isLoading: isAdminCheckLoading } =
    useIsUserIsomerAdmin({
      roles: [IsomerAdminRole.Core, IsomerAdminRole.Migrator],
    })
  const egazette = useEgazetteInfo()

  const isToppanUser = me.email.endsWith(TOPPAN_EMAIL_DOMAIN)
  const hasGazetteAccess = isToppanUser || isIsomerAdmin

  useEffect(() => {
    if (!isAdminCheckLoading && !hasGazetteAccess) {
      void router.replace("/")
    }
  }, [hasGazetteAccess, isAdminCheckLoading, router])

  if (!hasGazetteAccess) {
    return null
  }

  // The feature flag is the source of truth for the gazette collection id.
  // Without it we can't safely call the backend, so render an explicit empty
  // state rather than firing a query with `collectionId: 0` (which Zod
  // rejects with an opaque error).
  if (!egazette.isConfigured) {
    return (
      <Center minH="50vh">
        <VStack spacing="0.5rem">
          <Text textStyle="subhead-1" color="base.content.strong">
            Gazettes are not enabled for this account
          </Text>
          <Text textStyle="body-2" color="base.content.medium">
            Please contact
            <Link variant="inline" href={ISOMER_SUPPORT_LINK}>
              support
            </Link>
            if you believe this is incorrect.
          </Text>
        </VStack>
      </Center>
    )
  }

  return (
    <Suspense fallback={null}>
      <GazetteSubcategoriesProvider
        siteId={siteId}
        gazettesCollectionId={Number(egazette.gazettesCollectionId)}
      >
        <>
          <DashboardLayout
            breadcrumbs={[
              {
                href: `/sites/${siteId}/gazettes`,
                label: "Government Gazettes",
              },
            ]}
            icon={<BiData />}
            title="Government Gazettes"
            buttons={
              <Button
                size="md"
                leftIcon={<BiPlus fontSize="1.25rem" />}
                onClick={onOpen}
              >
                Add a new Gazette
              </Button>
            }
          >
            <GazetteTable
              siteId={siteId}
              collectionId={Number(egazette.gazettesCollectionId)}
            />
          </DashboardLayout>
          <CreateGazetteModal
            isOpen={isOpen}
            onClose={onClose}
            siteId={siteId}
            collectionId={Number(egazette.gazettesCollectionId)}
          />
        </>
      </GazetteSubcategoriesProvider>
    </Suspense>
  )
}

GazettesPage.getLayout = (page) => {
  return (
    <PermissionsBoundary
      resourceType={ResourceType.Collection}
      page={SiteMinimalLayout(page)}
    />
  )
}

export default GazettesPage
