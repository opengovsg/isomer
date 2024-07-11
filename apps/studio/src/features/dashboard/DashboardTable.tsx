import { useState } from "react"
import {
  Badge,
  Box,
  Checkbox,
  HStack,
  Icon,
  IconButton,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
} from "@chakra-ui/react"
import { Pagination } from "@opengovsg/design-system-react"
import {
  BiDotsHorizontalRounded,
  BiFileBlank,
  BiFolder,
  BiHome,
  BiSolidCircle,
} from "react-icons/bi"
import { MdOutlineHorizontalRule } from "react-icons/md"

export const DashboardTable = (): JSX.Element => {
  const dummyChildData: {
    id: string
    name: string
    permalink: string
    type: "page" | "folder"
    status: "folder" | "draft" | "published"
    lastEditUser: string
    lastEditDate: Date | "folder"
  }[] = [
    {
      id: "0001",
      name: "Test Page 1",
      permalink: "/",
      type: "page",
      status: "draft",
      lastEditUser: "user1@test.com",
      lastEditDate: new Date(),
    },
    {
      id: "0003",
      name: "Test Folder 1",
      permalink: "/testfolder1",
      type: "folder",
      status: "folder",
      lastEditUser: "folder",
      lastEditDate: "folder",
    },
    {
      id: "0002",
      name: "Test Page 2",
      permalink: "/testpage2",
      type: "page",
      status: "published",
      lastEditUser: "user2@test.com",
      lastEditDate: new Date(50000000000),
    },
    {
      id: "0004",
      name: "Test Folder 2",
      permalink: "/testfolder2",
      type: "folder",
      status: "folder",
      lastEditUser: "folder",
      lastEditDate: "folder",
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
              .map((element, index) => {
                return (
                  <Tr key={index}>
                    <Td w="min-content">
                      <Checkbox size="sm" w="fit-content" h="fit-content" />
                    </Td>

                    <Td>
                      <HStack spacing="0.75rem">
                        {element.type === "page" &&
                          element.permalink === "/" && (
                            <BiHome size="1.25rem" />
                          )}
                        {element.type === "page" &&
                          element.permalink !== "/" && (
                            <BiFileBlank size="1.25rem" />
                          )}
                        {element.type === "folder" && (
                          <BiFolder size="1.25rem" />
                        )}

                        <VStack alignItems="flex-start">
                          <Text textStyle="subhead-2">{element.name}</Text>
                          <Text textStyle="caption-2">
                            {element.type === "page" && element.permalink}
                            {element.type === "folder" && "0 pages"}
                          </Text>
                        </VStack>
                      </HStack>
                    </Td>

                    <Td>
                      {element.type === "page" && element.status == "draft" && (
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
                      {element.type === "page" &&
                        element.status == "published" && (
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
                      {element.type === "folder" && <MdOutlineHorizontalRule />}
                    </Td>

                    <Td>
                      <HStack justifyContent="space-between">
                        {element.type === "page" && (
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
                              )}{" "}
                              Days Ago
                            </Text>
                          </VStack>
                        )}

                        {element.type === "folder" && (
                          <MdOutlineHorizontalRule />
                        )}
                        <IconButton
                          variant="clear"
                          colorScheme="neutral"
                          aria-label={"Manage"}
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
