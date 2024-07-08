import { useDisclosure, HStack, VStack, Text } from '@chakra-ui/react'
import { Button } from '@opengovsg/design-system-react'
import { type NextPageWithLayout } from '~/lib/types'
import _ from 'lodash'
import { DashboardTable } from '~/features/dashboard/DashboardTable'
import PageCreateModal from '~/features/editing-experience/components/PageCreateModal'

const Dashboard: NextPageWithLayout = () => {
  const {
    isOpen: isPageCreateModalOpen,
    onOpen: onPageCreateModalOpen,
    onClose: onpageCreateModalClose,
  } = useDisclosure()
  return (
    <VStack bgColor="#F3F5F7" w="100%" p="1.75rem" minH="100vh">
      <Text
        alignSelf="flex-start"
        textColor="base.content.default"
        textStyle="h5"
      >
        My Pages
      </Text>
      <HStack w="100%" alignItems="end">
        <Text
          alignSelf="flex-start"
          mr="auto"
          textColor="base.content.default"
          textStyle="body-2"
        >
          Double click a page to start editing.
        </Text>
        <Button alignSelf="flex-end" ml="auto" variant="outline" size="xs">
          Create a folder
        </Button>
        <Button onClick={onPageCreateModalOpen} alignSelf="flex-end" size="xs">
          Create a new page
        </Button>
      </HStack>
      <DashboardTable />
      <PageCreateModal
        isOpen={isPageCreateModalOpen}
        onClose={onpageCreateModalClose}
      />
    </VStack>
  )
}

export default Dashboard
