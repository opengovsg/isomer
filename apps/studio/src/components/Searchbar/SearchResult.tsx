import { HStack, Icon, Text, VStack } from "@chakra-ui/react"

import type { ResourceType } from "~prisma/generated/generatedEnums"
import { ICON_MAPPINGS } from "~/features/dashboard/components/DirectorySidebar/constants"
import { getLinkToResource } from "~/utils/resource"

export interface SearchResultProps {
  type: ResourceType
  title: string
  fullPermalink: string
  id: string
  siteId: string
}
export const SearchResult = ({
  type,
  title,
  fullPermalink,
  id,
  siteId,
}: SearchResultProps) => {
  return (
    <HStack
      py="0.75rem"
      px="0.5rem"
      spacing="1rem"
      w="full"
      as="a"
      _hover={{
        background: "interaction.muted.main.hover",
      }}
      _focus={{
        background: "interaction.muted.main.active",
      }}
      href={getLinkToResource({ siteId, type, resourceId: id })}
    >
      <Icon as={ICON_MAPPINGS[type]} fill="base.content.medium" />
      <VStack alignItems="flex-start" spacing={0}>
        <Text textStyle="subhead-2" textColor="base.content.default">
          {title}
        </Text>
        <Text textStyle="caption-2" textColor="base.content.medium">
          {fullPermalink}
        </Text>
      </VStack>
    </HStack>
  )
}
