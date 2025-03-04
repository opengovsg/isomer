import { useContext } from "react"
import { Box, HStack, Text, VStack } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { ResourceType } from "~prisma/generated/generatedEnums"
import { useSetAtom } from "jotai"
import { BiPlus } from "react-icons/bi"
import { PiUsersBold } from "react-icons/pi"
import { z } from "zod"

import { PermissionsBoundary } from "~/components/AuthWrappers/PermissionsBoundary"
import { UserManagementContext, UserManagementProvider } from "~/features/users"
import { addUserModalOpenAtom } from "~/features/users/atom"
import { EditUserModal, UserTableTabs } from "~/features/users/components"
import { CollaboratorsDescription } from "~/features/users/components/CollaboratorsDescription"
import { AddUserModal } from "~/features/users/components/UserPermissionModal"
import { useQueryParse } from "~/hooks/useQueryParse"
import { type NextPageWithLayout } from "~/lib/types"
import { AdminSidebarOnlyLayout } from "~/templates/layouts/AdminSidebarOnlyLayout"
import { trpc } from "~/utils/trpc"

const siteUsersSchema = z.object({
  siteId: z.coerce.number(),
})

const UserManagementLayout = ({ children }: { children: React.ReactNode }) => {
  const { siteId } = useQueryParse(siteUsersSchema)
  return (
    <UserManagementProvider siteId={siteId}>{children}</UserManagementProvider>
  )
}

const SiteUsersPage: NextPageWithLayout = () => {
  const ability = useContext(UserManagementContext)

  const setAddUserModalOpen = useSetAtom(addUserModalOpenAtom)

  const { siteId } = useQueryParse(siteUsersSchema)

  const { data: agencyUsersCount = 0 } = trpc.user.count.useQuery({
    siteId,
    getIsomerAdmins: false,
  })

  const { data: isomerAdminsCount = 0 } = trpc.user.count.useQuery({
    siteId,
    getIsomerAdmins: true,
  })

  const { data: hasInactiveUsers = false } =
    trpc.user.hasInactiveUsers.useQuery({
      siteId,
    })

  return (
    <>
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
                  <PiUsersBold />
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
              <CollaboratorsDescription />
            </VStack>
            {ability.can("manage", "UserManagement") && (
              <Button
                variant="solid"
                leftIcon={<BiPlus />}
                onClick={() => setAddUserModalOpen(true)}
              >
                Add new user
              </Button>
            )}
          </HStack>
        </VStack>
        <UserTableTabs
          siteId={siteId}
          agencyUsersCount={agencyUsersCount}
          isomerAdminsCount={isomerAdminsCount}
          hasInactiveUsers={hasInactiveUsers}
        />
      </VStack>
      <AddUserModal siteId={siteId} />
      <EditUserModal siteId={siteId} />
    </>
  )
}

SiteUsersPage.getLayout = (page: React.ReactNode) => {
  return (
    <PermissionsBoundary
      resourceType={ResourceType.RootPage}
      page={AdminSidebarOnlyLayout(
        <UserManagementLayout>{page}</UserManagementLayout>,
      )}
    />
  )
}

export default SiteUsersPage
