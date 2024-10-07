import { Flex } from "@chakra-ui/react"

import { DirectorySidebarContent } from "./DirectorySidebarContent"

interface DirectorySidebarProps {
  siteId: string
}

export const DirectorySidebar = ({
  siteId,
}: DirectorySidebarProps): JSX.Element => {
  return (
    <Flex flexDir="column" px="1.25rem" py="1.75rem" height="full">
      <DirectorySidebarContent
        siteId={siteId}
        resourceId={null}
        item={{ permalink: "", type: "RootPage" }}
        defaultIndex={0}
        level={0}
      />
    </Flex>
  )
}
