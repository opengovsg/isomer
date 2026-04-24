import { useDisclosure } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { BiData, BiPlus } from "react-icons/bi"
import { z } from "zod"
import { PermissionsBoundary } from "~/components/AuthWrappers"
import { DashboardLayout } from "~/features/dashboard/components/DashboardLayout"
import { CreateGazetteModal, GazetteTable } from "~/features/gazettes"
import { MOCK_GAZETTES } from "~/features/gazettes/mockData"
import { useQueryParse } from "~/hooks/useQueryParse"
import { type NextPageWithLayout } from "~/lib/types"
import { SiteMinimalLayout } from "~/templates/layouts/SiteMinimalLayout"
import { ResourceType } from "~prisma/generated/generatedEnums"

export const gazettePageSchema = z.object({
  siteId: z.coerce.number(),
})

const GazettesPage: NextPageWithLayout = () => {
  const { siteId } = useQueryParse(gazettePageSchema)
  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
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
        <GazetteTable data={MOCK_GAZETTES} totalCount={4502} />
      </DashboardLayout>
      <CreateGazetteModal isOpen={isOpen} onClose={onClose} />
    </>
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
