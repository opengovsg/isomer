import { Flex } from "@chakra-ui/react"
import { ResourceType } from "~prisma/generated/generatedEnums"

import { DirectorySidebarContent } from "./DirectorySidebarContent"

interface DirectorySidebarProps {
  siteId: string
}

export const DirectorySidebar = ({
  siteId,
}: DirectorySidebarProps): JSX.Element => {
  return (
    <Flex flexDir="column" px="1.25rem" py="1.75rem">
      <DirectorySidebarContent
        siteId={siteId}
        resourceId={null}
        item={{ permalink: "", type: ResourceType.RootPage }}
        defaultIndex={0}
        level={0}
        subLabel="Home"
      />
    </Flex>
  )
}
