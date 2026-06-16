import { Box, Heading, Stack, Text } from "@chakra-ui/react"

export const PreviewUnavailable = (): JSX.Element => {
  return (
    <Box
      minH="100vh"
      bg="base.canvas.brand-subtle"
      display="flex"
      alignItems="center"
      justifyContent="center"
      px="1rem"
    >
      <Stack
        maxW="32rem"
        textAlign="center"
        spacing="1rem"
        bg="white"
        p="2rem"
        borderRadius="md"
        shadow="md"
      >
        <Heading as="h1" size="md">
          This preview is no longer available
        </Heading>
        <Text color="base.content.medium">
          The link you opened has expired or been revoked. Please contact the
          person who shared it for an updated link.
        </Text>
      </Stack>
    </Box>
  )
}
