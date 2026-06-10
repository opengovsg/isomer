import { Center, Flex, Icon, Stack, Text } from "@chakra-ui/react"
import { Link } from "@opengovsg/design-system-react"
import { BiWrench } from "react-icons/bi"

export const RedirectsHeader = (): JSX.Element => {
  return (
    <Flex justifyContent="space-between" align="center" w="full">
      <Stack spacing="0.5rem">
        <Flex align="center" gap="0.75rem">
          <Center
            w="2rem"
            h="2rem"
            bgColor="brand.secondary.100"
            borderRadius="6px"
          >
            <Icon as={BiWrench} boxSize="1rem" />
          </Center>
          <Text as="h1" textStyle="h3">
            Redirects
          </Text>
        </Flex>
        <Text textStyle="body-2" color="base.content.medium" maxW="44rem">
          When someone visits a link that is no longer in use, Redirects send
          them elsewhere so they don&apos;t get lost.
          <br />
          Learn{" "}
          <Link variant="inline" href="https://support.isomer.gov.sg">
            how to use redirects
          </Link>
          .
        </Text>
      </Stack>
    </Flex>
  )
}
