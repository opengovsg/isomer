import { Box, HStack, Text, VStack } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { ResourceType } from "~prisma/generated/generatedEnums"
import { BiPlus } from "react-icons/bi"
import { LuUsers } from "react-icons/lu"
import { z } from "zod"

import { PermissionsBoundary } from "~/components/AuthWrappers/PermissionsBoundary"
import { UserTableTabs } from "~/features/users/components"
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
      <UserTableTabs
        siteId={siteId}
        agencyUsersCount={agencyUsersCount}
        isomerAdminsCount={isomerAdminsCount}
      />
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
