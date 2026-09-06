import type { PropsWithChildren } from "react"
import { createContext, useContext } from "react"
import { Box, IconButton, Stack, Text } from "@chakra-ui/react"
import { Infobox } from "@opengovsg/design-system-react"
import type { FallbackProps } from "react-error-boundary"
import { ErrorBoundary } from "react-error-boundary"
import { BiTrash } from "react-icons/bi"

const LinkErrorBoundaryResetLinkContext = createContext<
  (() => void) | undefined
>(undefined)

const LinkErrorFallback = ({
  resetErrorBoundary,
}: FallbackProps): JSX.Element => {
  const resetLink = useContext(LinkErrorBoundaryResetLinkContext)
  if (!resetLink) {
    throw new Error("LinkErrorFallback must be used within LinkErrorBoundary")
  }

  return (
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
  )
}

interface LinkErrorBoundaryProps {
  resetLink: () => void
}
export const LinkErrorBoundary = ({
  resetLink,
  children,
}: PropsWithChildren<LinkErrorBoundaryProps>) => {
  return (
    <LinkErrorBoundaryResetLinkContext.Provider value={resetLink}>
      <ErrorBoundary FallbackComponent={LinkErrorFallback}>
        {children}
      </ErrorBoundary>
    </LinkErrorBoundaryResetLinkContext.Provider>
  )
}
