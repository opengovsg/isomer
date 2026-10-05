import { Flex, Td, Text, Tr, VStack } from "@chakra-ui/react"
import { AddNewUserButton } from "~/features/users/components"

interface UserTableEmptyStateProps {
  siteId: number
  promptAddUser?: boolean
  colSpan: number
}

export const UserTableEmptyState = ({
  siteId,
  promptAddUser = true,
  colSpan,
}: UserTableEmptyStateProps) => {
  return (
    <Tr aria-hidden>
      <Td colSpan={colSpan}>
        <Flex align="center" justify="center" minHeight="50vh" py="4rem">
          <VStack align="center" gap="1.5rem">
            <VStack align="center" gap="0.5rem">
              <Text textStyle="h5">No users yet</Text>
              {promptAddUser && (
                <Text textStyle="body-2">
                  Add users to start working with you on this site
                </Text>
              )}
            </VStack>
            {promptAddUser && <AddNewUserButton siteId={siteId} size="sm" />}
          </VStack>
        </Flex>
      </Td>
    </Tr>
  )
}
