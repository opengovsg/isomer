import { Box, HStack, Text, useDisclosure, VStack } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"

import { ResourceTable } from "~/features/dashboard/components/ResourceTable"
import PageCreateModal from "~/features/editing-experience/components/PageCreateModal"
import { type NextPageWithLayout } from "~/lib/types"
import { AdminCmsSidebarLayout } from "~/templates/layouts/AdminCmsSidebarLayout"

const SitePage: NextPageWithLayout = () => {
  const {
    isOpen: isPageCreateModalOpen,
    onOpen: onPageCreateModalOpen,
    onClose: onpageCreateModalClose,
  } = useDisclosure()
  return (
    <>
      <VStack w="100%" p="1.75rem" gap="1rem">
        <VStack w="100%" align="start">
          <Text textColor="base.content.default" textStyle="h5">
            My Pages
          </Text>
          <HStack w="100%" justify="space-between" align="center" gap={0}>
            <Box />
            <HStack gap="0.25rem" justifySelf="flex-end">
              <Button variant="outline" size="xs">
                Create a folder
              </Button>
              <Button onClick={onPageCreateModalOpen} size="xs">
                Create a new page
              </Button>
            </HStack>
          </HStack>
        </VStack>
        <Box width="100%">
          <ResourceTable />
        </Box>
      </VStack>
      <PageCreateModal
        isOpen={isPageCreateModalOpen}
        onClose={onpageCreateModalClose}
      />
    </>
  )
}

SitePage.getLayout = AdminCmsSidebarLayout
export default SitePage
