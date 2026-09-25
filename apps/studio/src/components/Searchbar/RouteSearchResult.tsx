import type { MatchedStudioRoute } from "~/schemas/routeSearch"
import { Box, HStack, Icon, Text, VStack } from "@chakra-ui/react"
import { BiDirections } from "react-icons/bi"

interface RouteSearchResultsProps {
  routes: MatchedStudioRoute[]
}

export const RouteSearchResults = ({ routes }: RouteSearchResultsProps) => {
  if (routes.length === 0) return null

  return (
    <VStack gap="0.75rem" align="start" w="full">
      <Text textColor="base.content.medium" textStyle="body-2">
        Places in Studio
      </Text>
      <VStack gap="0.25rem" w="full">
        {routes.map((route) => (
          <HStack
            key={route.id}
            py="0.75rem"
            px="0.5rem"
            spacing="0.75rem"
            w="full"
            as="a"
            href={route.href}
            borderRadius="0.25rem"
            alignItems="flex-start"
            _hover={{ background: "interaction.muted.main.hover" }}
            _focus={{ background: "interaction.muted.main.active" }}
          >
            <Icon
              as={BiDirections}
              fill="base.content.medium"
              height="1.25rem"
            />
            <Box display="flex" flexDir="column" gap="0.25rem">
              <Text textStyle="subhead-2" textColor="base.content.default">
                {route.label}
              </Text>
              <Text
                textStyle="caption-2"
                textColor="base.content.medium"
                noOfLines={1}
              >
                {route.href}
              </Text>
            </Box>
          </HStack>
        ))}
      </VStack>
    </VStack>
  )
}
