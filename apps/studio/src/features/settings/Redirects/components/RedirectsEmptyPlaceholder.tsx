import { Flex, Stack, Td, Text, Tr } from "@chakra-ui/react"
import { Link } from "@opengovsg/design-system-react"

// Shown in place of table rows when a site has no redirects yet. Unlike the
// generic EmptyTablePlaceholder, this points users to the redirects guide.
export const RedirectsEmptyPlaceholder = (): JSX.Element => {
  return (
    <Tr>
      <Td colSpan={4} border="none">
        <Flex align="center" justify="center" py="8.5rem">
          <Stack align="center" spacing="0.5rem" textAlign="center">
            <Text textStyle="subhead-1" color="base.content.default">
              No redirects yet
            </Text>
            <Text textStyle="body-2" color="base.content.default">
              Unsure how to use redirects?{" "}
              <Link
                variant="inline"
                isExternal
                href="https://support.isomer.gov.sg"
              >
                Read our guide
              </Link>
              .
            </Text>
          </Stack>
        </Flex>
      </Td>
    </Tr>
  )
}
