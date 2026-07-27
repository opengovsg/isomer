import type { GetServerSideProps } from "next"
import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  Flex,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react"
import { useToast } from "@opengovsg/design-system-react"
import NextLink from "next/link"
import { useState } from "react"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { requireGodModeAdmin } from "~/features/godmode/serverSideProps"
import { type NextPageWithLayout } from "~/lib/types"
import { AuthenticatedLayout } from "~/templates/layouts/AuthenticatedLayout"
import { trpc } from "~/utils/trpc"
import { IsomerAdminRole } from "~prisma/generated/generatedEnums"

export const getServerSideProps: GetServerSideProps = (context) =>
  requireGodModeAdmin(context, [IsomerAdminRole.Core])

const GodModePublishingPage: NextPageWithLayout = () => {
  const toast = useToast()
  const [publishingSiteIds, setPublishingSiteIds] = useState<Set<number>>(
    new Set(),
  )

  const { data: sites = [] } = trpc.site.listAllSites.useQuery()

  const { mutate: publishOneSite } = trpc.site.publish.useMutation({
    onSettled: (_, __, { siteId }) => {
      setPublishingSiteIds((prev) => {
        const next = new Set(prev)
        next.delete(siteId)
        return next
      })
    },
    onSuccess: () => {
      toast({
        title: "Site published successfully",
        status: "success",
        ...BRIEF_TOAST_SETTINGS,
      })
    },
    onError: (error) => {
      toast({
        title: "Failed to publish site",
        description: error.message,
        status: "error",
        ...BRIEF_TOAST_SETTINGS,
      })
    },
  })

  return (
    <Flex flexDir="column" py="2rem" maxW="57rem" mx="auto" width="100%">
      <Breadcrumb>
        <BreadcrumbItem>
          <BreadcrumbLink href="/" as={NextLink}>
            Home
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink href="/godmode" as={NextLink}>
            👁️ God Mode 👁️
          </BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <Text as="h3" size="lg" textStyle="h3">
        Publishing
      </Text>

      <Box mt={8} bg="white" borderRadius="md" p={4}>
        <Text fontWeight="bold" mb={4}>
          What happens when you publish a site?
        </Text>
        <Text>
          The latest published version of the site will be deployed to
          production.
        </Text>
      </Box>

      <Box mt={8} bg="white" borderRadius="md" p={4}>
        <Text fontWeight="bold" mb={4}>
          Sites
        </Text>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Site Name</Th>
              <Th>Site ID</Th>
              <Th>CodeBuild ID</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {sites.map((site) => (
              <Tr key={site.id}>
                <Td>{site.id}</Td>
                <Td>{site.config.siteName}</Td>
                <Td>{site.codeBuildId || "-"}</Td>
                <Td>
                  {site.codeBuildId && (
                    <Button
                      size="xs"
                      colorScheme="blue"
                      onClick={() => {
                        setPublishingSiteIds((prev) =>
                          new Set(prev).add(site.id),
                        )
                        publishOneSite({ siteId: site.id })
                      }}
                      isLoading={publishingSiteIds.has(site.id)}
                      isDisabled={publishingSiteIds.has(site.id)}
                    >
                      Publish
                    </Button>
                  )}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Flex>
  )
}

GodModePublishingPage.getLayout = AuthenticatedLayout

export default GodModePublishingPage
