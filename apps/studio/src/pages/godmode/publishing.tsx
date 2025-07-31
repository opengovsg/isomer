import { useEffect } from "react"
import NextLink from "next/link"
import { useRouter } from "next/router"
import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  Flex,
  HStack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react"
import { useToast } from "@opengovsg/design-system-react"

import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { useIsUserIsomerAdmin } from "~/hooks/useIsUserIsomerAdmin"
import { ADMIN_ROLE } from "~/lib/growthbook"
import { type NextPageWithLayout } from "~/lib/types"
import { AdminLayout } from "~/templates/layouts/AdminLayout"
import { trpc } from "~/utils/trpc"

const GodModePublishingPage: NextPageWithLayout = () => {
  const toast = useToast()
  const router = useRouter()
  const isUserIsomerAdmin = useIsUserIsomerAdmin({
    roles: [ADMIN_ROLE.CORE],
  })

  if (!isUserIsomerAdmin) {
    toast({
      title: "You do not have permission to access this page.",
      status: "error",
      ...BRIEF_TOAST_SETTINGS,
    })
    void router.push(`/`)
  }

  const { data: sites = [] } = trpc.site.listAllSites.useQuery()

  const publishOneSiteMutation = trpc.site.publish.useMutation()

  useEffect(() => {
    if (publishOneSiteMutation.isSuccess) {
      toast({
        title: "Site published successfully",
        status: "success",
        ...BRIEF_TOAST_SETTINGS,
      })
    }
  }, [publishOneSiteMutation.isSuccess, toast])

  useEffect(() => {
    if (publishOneSiteMutation.isError) {
      toast({
        title: "Failed to publish site",
        description: publishOneSiteMutation.error.message,
        status: "error",
        ...BRIEF_TOAST_SETTINGS,
      })
    }
  }, [publishOneSiteMutation.isError, publishOneSiteMutation.error, toast])

  const publishAllSiteMutation = trpc.site.publishAll.useMutation()

  useEffect(() => {
    if (publishAllSiteMutation.isSuccess) {
      const { siteCount } = publishAllSiteMutation.data
      toast({
        title: `Starting to publish ${siteCount} sites in the background...`,
        status: "success",
        ...BRIEF_TOAST_SETTINGS,
      })
    }
  }, [publishAllSiteMutation.isSuccess, publishAllSiteMutation.data, toast])

  useEffect(() => {
    if (publishAllSiteMutation.isError) {
      toast({
        title: "Failed to publish site",
        description: publishAllSiteMutation.error.message,
        status: "error",
        ...BRIEF_TOAST_SETTINGS,
      })
    }
  }, [publishAllSiteMutation.isError, publishAllSiteMutation.error, toast])

  const isLoading =
    publishOneSiteMutation.isPending || publishAllSiteMutation.isPending

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
          <br />
          Mass publishing is used when we have to publish to all the live sites
          e.g. features/fixes for Template library.
        </Text>
      </Box>

      <Box mt={8} bg="white" borderRadius="md" p={4}>
        <HStack justify="space-between" mb={4}>
          <Text fontWeight="bold">Sites</Text>
          <Button
            colorScheme="blue"
            onClick={() => publishAllSiteMutation.mutate()}
            isLoading={isLoading}
          >
            Publish All
          </Button>
        </HStack>
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
                      onClick={() =>
                        publishOneSiteMutation.mutate({ siteId: site.id })
                      }
                      isLoading={isLoading}
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

GodModePublishingPage.getLayout = AdminLayout

export default GodModePublishingPage
