import { Box, Heading, Stack, Text } from "@chakra-ui/react"

export const PreviewRateLimited = (): JSX.Element => {
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
          You&apos;re refreshing this preview very rapidly
        </Heading>
        <Text color="base.content.medium">
          Please wait a moment, then refresh again.
        </Text>
      </Stack>
    </Box>
  )
}
