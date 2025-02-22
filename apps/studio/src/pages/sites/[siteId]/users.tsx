import {
  Box,
  HStack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  VStack,
} from "@chakra-ui/react"
import { Badge, Button } from "@opengovsg/design-system-react"
import { ResourceType } from "~prisma/generated/generatedEnums"
import { BiPlus } from "react-icons/bi"
import { LuUsers } from "react-icons/lu"
import { z } from "zod"

import { PermissionsBoundary } from "~/components/AuthWrappers/PermissionsBoundary"
import { UserTable } from "~/features/users/components/UserTable"
import { useQueryParse } from "~/hooks/useQueryParse"
import { type NextPageWithLayout } from "~/lib/types"
import { AdminSidebarOnlyLayout } from "~/templates/layouts/AdminSidebarOnlyLayout"
import { trpc } from "~/utils/trpc"

const siteUsersSchema = z.object({
  siteId: z.coerce.number(),
})

const SiteUsersPage: NextPageWithLayout = () => {
  const { siteId } = useQueryParse(siteUsersSchema)
  const { data: agencyUsersCount = 0 } = trpc.user.count.useQuery({
    siteId,
    getIsomerAdmins: false,
  })
  const { data: isomerAdminsCount = 0 } = trpc.user.count.useQuery({
    siteId,
    getIsomerAdmins: true,
  })

  return (
    <VStack
      w="100%"
      p="1.75rem"
      gap="1rem"
      height="0"
      overflow="auto"
      minH="100%"
      alignItems="start"
    >
      <VStack w="100%" align="start">
        <HStack w="100%" justifyContent="space-between" alignItems="end">
          <VStack gap="0.5rem" align="start">
            <HStack mr="1.25rem" overflow="auto" gap="0.75rem" flex={1}>
              <Box
                aria-hidden
                bg="brand.secondary.100"
                p="0.5rem"
                borderRadius="6px"
              >
                <LuUsers />
              </Box>
              <Text
                noOfLines={1}
                as="h3"
                textStyle="h3"
                textOverflow="ellipsis"
                wordBreak="break-all"
              >
                Collaborators
              </Text>
            </HStack>
            <Text textStyle="body-2">
              View and manage people that you collaborate with you on this site.
            </Text>
          </VStack>
          <Button variant="solid" leftIcon={<BiPlus />}>
            Add new user
          </Button>
        </HStack>
      </VStack>
      <Tabs w="100%">
        <TabList mb="1rem" borderBottomColor="base.divider.medium">
          <Tab
            textTransform="none"
            _selected={{
              color: "base.content.brand",
              "& .count-badge": {
                bg: "base.content.brand",
                color: "base.content.inverse",
              },
            }}
          >
            <Text textStyle="subhead-2">Your users</Text>
            <Badge
              className="count-badge"
              variant="subtle"
              colorScheme="neutral"
              size="xs"
              ml={1}
              borderRadius="full"
            >
              {agencyUsersCount}
            </Badge>
          </Tab>
          <Tab
            textTransform="none"
            _selected={{
              color: "base.content.brand",
              "& .count-badge": {
                bg: "base.content.brand",
                color: "base.content.inverse",
              },
            }}
          >
            <Text textStyle="subhead-2">Isomer admins</Text>
            <Badge
              className="count-badge"
              variant="subtle"
              colorScheme="neutral"
              size="xs"
              ml={1}
              borderRadius="full"
            >
              {isomerAdminsCount}
            </Badge>
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <UserTable siteId={siteId} getIsomerAdmins={false} />
          </TabPanel>
          <TabPanel>
            <UserTable siteId={siteId} getIsomerAdmins={true} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </VStack>
  )
}

SiteUsersPage.getLayout = (page: React.ReactNode) => {
  return (
    <PermissionsBoundary
      resourceType={ResourceType.RootPage}
      page={AdminSidebarOnlyLayout(page)}
    />
  )
}

export default SiteUsersPage
