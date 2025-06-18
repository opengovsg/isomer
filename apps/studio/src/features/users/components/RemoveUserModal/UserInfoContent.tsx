import { Suspense } from "react"
import { Badge, Box, HStack, Skeleton, Text, VStack } from "@chakra-ui/react"

import { trpc } from "~/utils/trpc"
import { getLastLoginText } from "../../utils"

interface UserInfoContentProps {
  siteId: number
  userId: string
}

const SuspendableUserInfoContent = ({
  siteId,
  userId,
}: UserInfoContentProps) => {
  const [{ name, email, role, createdAt, lastLoginAt }] =
    trpc.user.getUser.useSuspenseQuery({ siteId, userId })

  let lastLoginAtText = getLastLoginText({ createdAt, lastLoginAt })
  if (lastLoginAt) {
    lastLoginAtText = `Last logged in ${lastLoginAtText.toLocaleLowerCase()}`
  }

  return (
    <>
      <VStack gap="0.25rem" align="start">
        <HStack gap="0.5rem">
          <Text textStyle="caption-1" color="base.content.default">
            {name}
          </Text>
          <Badge variant="subtle" size="xs">
            {role}
          </Badge>
        </HStack>
        <Text textStyle="caption-2" color="base.content.medium">
          {email}
        </Text>
      </VStack>
      <Text textStyle="caption-2" color="grey.700">
        {lastLoginAtText}
      </Text>
    </>
  )
}

export const UserInfoContent = (props: UserInfoContentProps) => {
  return (
    <Box
      backgroundColor="base.canvas.alt"
      borderRadius="0.25rem"
      py="0.75rem"
      px="1rem"
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      w="100%"
    >
      <Suspense fallback={<Skeleton w="100%" h="2rem" mt="0.5rem" />}>
        <SuspendableUserInfoContent {...props} />
      </Suspense>
    </Box>
  )
}
