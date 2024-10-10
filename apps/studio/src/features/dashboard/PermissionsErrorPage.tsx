import Link from "next/link"
import { Center, Flex, Stack, Text } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"

import { HeadScratch } from "~/components/Svg"

interface PermissionsErrorBoundaryProps {
  title: string
  description: string
  backTo: string
  buttonText: string
}
export const PermissionsErrorBoundary = ({
  title,
  description,
  backTo,
  buttonText,
}: PermissionsErrorBoundaryProps) => {
  return (
    <Center minH="$100vh">
      <Stack alignItems="center" dir="vertical" gap="3rem">
        <HeadScratch></HeadScratch>
        <Stack gap="1.75rem" alignItems="center">
          <Flex flexDir="column" alignItems="center">
            <Text as="h4" textStyle="h4">
              {title}
            </Text>
            <Text textStyle="body-1">{description}</Text>
          </Flex>
          <Button as={Link} href={backTo} size="md">
            {buttonText}
          </Button>
        </Stack>
      </Stack>
    </Center>
  )
}
