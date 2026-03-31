import { Box, Grid, GridItem, Skeleton, VStack } from "@chakra-ui/react"

export function LoadingPreview(): JSX.Element {
  return (
    <Box
      position="relative"
      overflow="hidden"
      h="calc(100vh - 6.5rem)"
      bg="white"
      px="2rem"
      py="1.5rem"
      shadow="md"
      borderRadius="0.5rem"
    >
      <Skeleton
        width="13rem"
        height="5rem"
        borderRadius="lg"
        startColor="gray.50"
        endColor="gray.100"
        mb="1.5rem"
      />

      <Skeleton
        width="100%"
        height="12rem"
        borderRadius="lg"
        startColor="gray.50"
        endColor="gray.100"
        mb="2rem"
      />

      <Grid templateColumns="1fr 4fr" gap="2rem" alignItems="start">
        <GridItem>
          <VStack gap="1rem">
            {Array(3)
              .fill(0)
              .map((_, n) => (
                <Skeleton
                  key={n}
                  width="100%"
                  height="18rem"
                  borderRadius="lg"
                  startColor="gray.50"
                  endColor="gray.100"
                />
              ))}
          </VStack>
        </GridItem>

        <GridItem>
          <VStack spacing={4} alignItems="flex-start">
            <Skeleton
              width="8.75rem"
              height="2rem"
              borderRadius="md"
              startColor="gray.100"
              endColor="gray.200"
            />

            {Array(5)
              .fill(0)
              .map((_, n) => (
                <Skeleton
                  key={n}
                  width="100%"
                  height="12rem"
                  borderRadius="lg"
                  startColor="gray.50"
                  endColor="gray.100"
                />
              ))}
          </VStack>
        </GridItem>
      </Grid>
    </Box>
  )
}
