import { Flex, Td, Text, Tr, VStack } from "@chakra-ui/react"

import { AddNewUserButton } from "~/features/users/components"

interface UserTableEmptyStateProps {
  siteId: number
  promptAddUser?: boolean
}

export const UserTableEmptyState = ({
  siteId,
  promptAddUser = true,
}: UserTableEmptyStateProps) => {
  return (
    <Tr aria-hidden>
      <Td colSpan={4}>
        <Flex align="center" justify="center" minHeight="50vh" py="4rem">
          <VStack align="center" gap="1.5rem">
            <VStack align="center" gap="0.5rem">
              <Text textStyle="h5">No collaborators yet</Text>
              {promptAddUser && (
                <Text textStyle="body-2">
                  Add users to start editing this site
                </Text>
              )}
            </VStack>
            {promptAddUser && <AddNewUserButton siteId={siteId} />}
          </VStack>
        </Flex>
      </Td>
    </Tr>
  )
}
