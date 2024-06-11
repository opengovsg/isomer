import {
  Box,
  Center,
  IconButton,
  Td,
  color,
  useDisclosure,
} from '@chakra-ui/react'
import { Badge, BadgeLeftIcon, Button } from '@opengovsg/design-system-react'
import PageCreateModal from '~/features/editing-experience/PageCreateModal'
import {
  HStack,
  VStack,
  Text,
  TableContainer,
  Th,
  Tbody,
  Table,
  Thead,
  Tr,
} from '@chakra-ui/react'
import { Checkbox, Pagination } from '@opengovsg/design-system-react'
import { VscAccount } from 'react-icons/vsc'
import { type NextPageWithLayout } from '~/lib/types'
import {
  BiDotsHorizontalRounded,
  BiFileBlank,
  BiFolder,
  BiHome,
  BiSolidCircle,
} from 'react-icons/bi'
import { useEffect, useState } from 'react'
import { boolean } from 'zod'
import _ from 'lodash'
import { MdOutlineHorizontalRule } from 'react-icons/md'
import { DashboardTable } from '~/features/dashboard/DashboardTable'

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
