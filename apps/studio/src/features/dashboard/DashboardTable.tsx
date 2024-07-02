import {
  Text,
  TableContainer,
  Table,
  Thead,
  Tr,
  Th,
  Checkbox,
  HStack,
  Tbody,
  Td,
  VStack,
  Badge,
  IconButton,
  Box,
  Icon,
} from '@chakra-ui/react'
import { Pagination } from '@opengovsg/design-system-react'
import { usePathname, useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  BiHome,
  BiFileBlank,
  BiFolder,
  BiSolidCircle,
  BiDotsHorizontalRounded,
} from 'react-icons/bi'
import { MdOutlineHorizontalRule } from 'react-icons/md'
import { trpc } from '~/utils/trpc'

// TODO: add loading state, probably not req for mvp

export default function DashboardTable(): JSX.Element {
  const router = useRouter()
  const [pageNumber, onPageChange] = useState(1)
  const [dataToDisplay, setDataToDisplay] = useState<
    {
      id: string
      name: string
      permalink: string
      type: 'page' | 'folder'
      status: 'draft' | 'published' | undefined
      lastEditUser: string | undefined
      lastEditDate: Date | undefined
    }[]
  >([])

  const entriesPerPage = 6

  let { siteId, resourceId } = useParams<{
    siteId: string
    resourceId: string
  }>()

  const { data, error, isLoading } = trpc.folder.readFolder.useQuery(
    {
      siteId: Number(siteId),
      resourceId: Number(resourceId),
    },
    { enabled: !!resourceId },
  )

  useEffect(() => {
    if (data) {
      console.log(data)
      setDataToDisplay(data.children)
    }
=  }, [data])

  // if (!resourceId) {
  //   // todo: fetch data after setting up root folder trpc endpoint
  // } else {
  //   const { data } = await trpc.folder.readFolder
  //     .useQuery({
  //       siteId,
  //       resourceId,
  //     })
  //     .setDataToDisplay(data)
  // }
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
              <Th w="5%">
                {/* checkbox */}
                <Checkbox size="sm" w="fit-content" h="fit-content" />
              </Th>
              <Th textTransform="none" w="65%">
                <HStack>
                  <Text textStyle="body-2">Title</Text>
                </HStack>
              </Th>
              <Th textTransform="none" w="8%">
                <HStack>
                  <Text textStyle="body-2">Status</Text>
                </HStack>
              </Th>
              <Th textTransform="none" w="22%">
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
                  <Tr key={element.id}>
                    <Td w="min-content">
                      <Checkbox size="sm" w="fit-content" h="fit-content" />
                    </Td>
                    {/* Change behavior for double click on folder */}
                    <Td
                      onDoubleClick={() =>
                        router.push(`/${siteId}/dashboard/${element.id}`)
                      }
                      cursor="default"
                    >
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
                      {element.type === 'page' &&
                        element.status === 'draft' && (
                          <Badge
                            variant="subtle"
                            colorScheme="warning"
                            borderRadius="50px"
                          >
                            <Icon
                              as={BiSolidCircle}
                              color="utility.feedback.warning"
                              mr="0.25rem"
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
                            <Icon
                              as={BiSolidCircle}
                              color="utility.feedback.success"
                              mr="0.25rem"
                            />
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
