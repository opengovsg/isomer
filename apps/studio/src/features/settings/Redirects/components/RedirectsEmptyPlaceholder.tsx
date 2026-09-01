import { Flex, Stack, Td, Text, Tr } from "@chakra-ui/react"
import { Link } from "@opengovsg/design-system-react"

import { REDIRECTS_SUPPORT_LINK } from "../constants"

interface RedirectsEmptyPlaceholderProps {
  // The table drops its delete column for a user who can't delete, so the
  // placeholder is told how many columns to span rather than assuming.
  colSpan: number
}

// Shown in place of table rows when a site has no redirects yet. Unlike the
// generic EmptyTablePlaceholder, this points users to the redirects guide.
export const RedirectsEmptyPlaceholder = ({
  colSpan,
}: RedirectsEmptyPlaceholderProps): JSX.Element => {
  return (
    <Tr>
      <Td colSpan={colSpan} border="none">
        <Flex align="center" justify="center" py="8.5rem">
          <Stack align="center" spacing="0.5rem" textAlign="center">
            <Text textStyle="subhead-1" color="base.content.default">
              No redirects yet
            </Text>
            <Text textStyle="body-2" color="base.content.default">
              Unsure how to use redirects?{" "}
              <Link variant="inline" isExternal href={REDIRECTS_SUPPORT_LINK}>
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
