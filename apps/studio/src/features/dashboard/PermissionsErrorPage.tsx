import { useRouter } from "next/router"
import { Center, Flex, Stack, Text } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"

import { HeadScratch } from "~/components/Svg"

interface PermissionsErrorBoundaryProps {
  title: string
  description: string
  buttonText: string
}
export const PermissionsErrorBoundary = ({
  title,
  description,
  buttonText,
}: PermissionsErrorBoundaryProps) => {
  const router = useRouter()

  return (
    <Center minH="$100vh" minW="full">
      <Stack alignItems="center" dir="vertical" gap="3rem">
        <HeadScratch></HeadScratch>
        <Stack gap="1.75rem" alignItems="center">
          <Flex flexDir="column" alignItems="center">
            <Text as="h4" textStyle="h4">
              {title}
            </Text>
            <Text textStyle="body-1">{description}</Text>
          </Flex>
          <Button onClick={router.back} size="md">
            {buttonText}
          </Button>
        </Stack>
      </Stack>
    </Center>
  )
}
