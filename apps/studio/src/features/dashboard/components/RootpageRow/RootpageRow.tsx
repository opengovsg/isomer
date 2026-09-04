import { HStack, IconButton, Text, VStack } from "@chakra-ui/react"
import Link from "next/link"
import { BiChevronRight, BiHomeAlt } from "react-icons/bi"
import { DraftIndicator } from "~/components/DraftIndicator"
import { LiveStatusBadges } from "~/components/LiveStatusBadges"
import { trpc } from "~/utils/trpc"

interface RootpageRowProps {
  siteId: number
}

// No menu/unpublish action here today. If one is ever added, exclude
// RootPage the same way ResourceTableMenu already excludes it from Delete —
// unpublishPage rejects RootPage server-side (see UNPUBLISHABLE_RESOURCE_TYPES
// in ~/constants/resources), so a client-side affordance would just surface
// a confusing error instead of failing silently.
export const RootpageRow = ({ siteId }: RootpageRowProps) => {
  const [
    {
      id,
      title,
      draftBlobId,
      publishedVersionId,
      scheduledAt,
      scheduledAction,
      lastPublishedAt,
    },
  ] = trpc.page.getRootPage.useSuspenseQuery({
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
      _hover={{ background: "interaction.muted.main.hover" }}
      data-group
    >
      <BiHomeAlt fontSize={"1.25rem"} />
      <VStack flex={1} gap="0.25rem" alignItems="flex-start">
        <HStack gap="0.25rem">
          <Text textStyle="subhead-2">{title}</Text>
          <LiveStatusBadges
            liveStatus={publishedVersionId !== null ? "live" : "notLive"}
            scheduledAt={scheduledAt}
            scheduledAction={scheduledAction}
            lastPublishedAt={lastPublishedAt}
          />
          <DraftIndicator draftBlobId={draftBlobId} />
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
