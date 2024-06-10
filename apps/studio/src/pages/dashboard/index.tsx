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

export const DashboardTable = (): JSX.Element => {
  const dummyChildData: {
    id: string
    name: string
    permalink: string
    type: 'page' | 'folder'
    status: 'folder' | 'draft' | 'published'
    lastEditUser: string
    lastEditDate: Date | 'folder'
  }[] = [
    {
      id: '0001',
      name: 'Test Page 1',
      permalink: '/',
      type: 'page',
      status: 'draft',
      lastEditUser: 'user1@test.com',
      lastEditDate: new Date(),
    },
    {
      id: '0003',
      name: 'Test Folder 1',
      permalink: '/testfolder1',
      type: 'folder',
      status: 'folder',
      lastEditUser: 'folder',
      lastEditDate: 'folder',
    },
    {
      id: '0002',
      name: 'Test Page 2',
      permalink: '/testpage2',
      type: 'page',
      status: 'published',
      lastEditUser: 'user2@test.com',
      lastEditDate: new Date(50000000000),
    },
    {
      id: '0004',
      name: 'Test Folder 2',
      permalink: '/testfolder2',
      type: 'folder',
      status: 'folder',
      lastEditUser: 'folder',
      lastEditDate: 'folder',
    },
  ]

  const [pageNumber, onPageChange] = useState(1)
  const [dataToDisplay, setDataToDisplay] = useState(dummyChildData)

  const entriesPerPage = 6
  return (
    <>
      <TableContainer
        w="100%"
        borderRadius="8px"
        border="1px"
        borderColor="base.divider.medium"
        bgColor="#FFF"
      >
        <Table>
          <Thead>
            <Tr>
              <Th w="auto">
                {/* checkbox */}
                <Checkbox size="sm" w="fit-content" h="fit-content" />
              </Th>
              <Th textTransform="none">
                <HStack>
                  <Text textStyle="body-2">Title</Text>
                </HStack>
              </Th>
              <Th textTransform="none">
                <HStack>
                  <Text textStyle="body-2">Status</Text>
                </HStack>
              </Th>
              <Th textTransform="none">
                <HStack>
                  <Text textStyle="body-2">Last Edited</Text>
                </HStack>
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {dataToDisplay
              .slice(
                (pageNumber - 1) * entriesPerPage,
                pageNumber * entriesPerPage,
              )
              .map((element) => {
                return (
                  <Tr>
                    <Td w="min-content">
                      <Checkbox size="sm" w="fit-content" h="fit-content" />
                    </Td>

                    <Td>
                      <HStack spacing="0.75rem">
                        {element.type === 'page' &&
                          element.permalink === '/' && (
                            <BiHome size="1.25rem" />
                          )}
                        {element.type === 'page' &&
                          element.permalink !== '/' && (
                            <BiFileBlank size="1.25rem" />
                          )}
                        {element.type === 'folder' && (
                          <BiFolder size="1.25rem" />
                        )}

                        <VStack alignItems="flex-start">
                          <Text textStyle="subhead-2">{element.name}</Text>
                          <Text textStyle="caption-2">
                            {element.type === 'page' && element.permalink}
                            {element.type === 'folder' && '0 pages'}
                          </Text>
                        </VStack>
                      </HStack>
                    </Td>

                    <Td>
                      {/* Fill doesn't seem to work with semantic tokens   */}
                      {element.type === 'page' && element.status == 'draft' && (
                        <Badge
                          variant="subtle"
                          colorScheme="warning"
                          borderRadius="50px"
                        >
                          <BiSolidCircle
                            fill="#FFDA68"
                            style={{ marginRight: '4px' }}
                          />
                          Draft
                        </Badge>
                      )}
                      {element.type === 'page' &&
                        element.status == 'published' && (
                          <Badge
                            variant="subtle"
                            colorScheme="success"
                            borderRadius="50px"
                          >
                            <BiSolidCircle style={{ marginRight: '4px' }} />
                            Published
                          </Badge>
                        )}
                      {element.type === 'folder' && <MdOutlineHorizontalRule />}
                    </Td>

                    <Td>
                      <HStack justifyContent="space-between">
                        {element.type === 'page' && (
                          <VStack alignSelf="stretch" alignItems="flex-start">
                            <Text
                              textColor="base.content.strong"
                              textStyle="caption-2"
                            >
                              {element.lastEditUser}
                            </Text>
                            <Text
                              textColor="base.content.medium"
                              textStyle="caption-2"
                            >
                              {Math.floor(
                                (new Date().getTime() -
                                  (element.lastEditDate as Date).getTime()) /
                                  (1000 * 3600 * 24),
                              )}{' '}
                              Days Ago
                            </Text>
                          </VStack>
                        )}

                        {element.type === 'folder' && (
                          <MdOutlineHorizontalRule />
                        )}
                        <IconButton
                          variant="clear"
                          colorScheme="neutral"
                          aria-label={'Manage'}
                          icon={<BiDotsHorizontalRounded size="1.5rem" />}
                        />
                      </HStack>
                    </Td>
                  </Tr>
                )
              })}
          </Tbody>
        </Table>
      </TableContainer>
      <Box alignSelf="flex-end">
        <Pagination
          currentPage={pageNumber}
          onPageChange={onPageChange}
          pageSize={entriesPerPage}
          totalCount={dataToDisplay.length}
        />
      </Box>
    </>
  )
}

export default Dashboard
