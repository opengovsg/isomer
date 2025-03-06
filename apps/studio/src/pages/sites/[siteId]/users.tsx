import { Box, HStack, Text, VStack } from "@chakra-ui/react"
import { ResourceType } from "~prisma/generated/generatedEnums"
import { PiUsersBold } from "react-icons/pi"
import { z } from "zod"

import { PermissionsBoundary } from "~/components/AuthWrappers"
import { UserManagementProvider } from "~/features/users"
import {
  AddNewUserButton,
  AddUserModal,
  EditUserModal,
  RemoveUserModal,
  UserTableTabs,
} from "~/features/users/components"
import { CollaboratorsDescription } from "~/features/users/components/CollaboratorsDescription"
import { useQueryParse } from "~/hooks/useQueryParse"
import { type NextPageWithLayout } from "~/lib/types"
import { AdminSidebarOnlyLayout } from "~/templates/layouts/AdminSidebarOnlyLayout"

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
  const { siteId } = useQueryParse(siteUsersSchema)

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
            <AddNewUserButton siteId={siteId} />
          </HStack>
        </VStack>
        <UserTableTabs siteId={siteId} />
      </VStack>
      <RemoveUserModal />
      <AddUserModal />
      <EditUserModal />
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
