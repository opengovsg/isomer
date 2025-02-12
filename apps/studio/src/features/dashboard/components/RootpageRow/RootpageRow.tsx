import Link from "next/link"
import { HStack, IconButton, Text, VStack } from "@chakra-ui/react"
import { BiChevronRight, BiHomeAlt } from "react-icons/bi"

import { trpc } from "~/utils/trpc"
import { StateBadge } from "../ResourceTable/StateCell"

interface RootpageRowProps {
  siteId: number
}

export const RootpageRow = ({ siteId }: RootpageRowProps) => {
  const [{ id, title, draftBlobId }] = trpc.page.getRootPage.useSuspenseQuery({
    siteId,
  })
  return (
    <HStack
      as={Link}
      href={`/sites/${siteId}/pages/${id}`}
      gap="0.75rem"
      px="1.25rem"
      py="0.5rem"
      w="full"
      bg="base.canvas.default"
      border="1px solid"
      borderColor="base.divider.medium"
      borderRadius="8px"
      layerStyle="focusRing"
      _active={{}}
      _hover={{ background: "interaction.muted.main.hover" }}
      data-group
    >
      <BiHomeAlt fontSize={"1.25rem"} />
      <VStack flex={1} gap="0.25rem" alignItems="flex-start">
        <HStack gap="0.25rem">
          <Text textStyle="subhead-2">{title}</Text>
          <StateBadge draftBlobId={draftBlobId} />
        </HStack>
        {/*   TODO: werequire the last updated at and to display it */}
        {/* as a relative time. */}
        {/* we also need to give the user who did the update */}
      </VStack>
      <Text
        textStyle="caption-2"
        _groupHover={{ display: "flex" }}
        _groupFocus={{ display: "flex" }}
        display="none"
      >
        Edit page
      </Text>
      <IconButton
        as="div"
        aria-hidden
        variant="clear"
        pointerEvents="none"
        colorScheme="neutral"
        icon={<BiChevronRight />}
        aria-label="edit homepage"
      />
    </HStack>
  )
}
