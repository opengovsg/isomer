import type { PropsWithChildren } from "react"
import { Box, IconButton, Stack, Text } from "@chakra-ui/react"
import { Infobox } from "@opengovsg/design-system-react"
import { ErrorBoundary } from "react-error-boundary"
import { BiTrash } from "react-icons/bi"

interface LinkErrorBoundaryProps {
  resetLink: () => void
}
export const LinkErrorBoundary = ({
  resetLink,
  children,
}: PropsWithChildren<LinkErrorBoundaryProps>) => {
  return (
    <ErrorBoundary
      fallbackRender={({ resetErrorBoundary }) => (
        <Box
          border="1px solid"
          borderColor="utility.feedback.critical"
          bgColor="utility.feedback.critical"
          borderRadius="0.25rem"
        >
          <Infobox variant="error" w="100%" borderRadius="0.2rem" size="sm">
            <Stack direction="column" w="full">
              <Text textStyle="subhead-2">
                The page you linked no longer exists
              </Text>
              <Text> Pick a different destination</Text>
            </Stack>
            <IconButton
              size="xs"
              variant="clear"
              alignSelf="center"
              colorScheme="critical"
              aria-label="Remove file"
              icon={<BiTrash />}
              onClick={() => {
                resetLink()
                resetErrorBoundary()
              }}
            />
          </Infobox>
        </Box>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}
