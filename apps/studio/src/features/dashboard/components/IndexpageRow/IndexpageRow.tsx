import Link from "next/link"
import { HStack, IconButton, Skeleton, Text, VStack } from "@chakra-ui/react"
import { Badge, BadgeLeftIcon } from "@opengovsg/design-system-react"
import { ResourceState } from "~prisma/generated/generatedEnums"
import { BiChevronRight, BiFile, BiSolidCircle } from "react-icons/bi"

import { trpc } from "~/utils/trpc"

interface IndexpageRowProps {
  siteId: number
  resourceId: string
}

export const IndexpageRow = ({ siteId, resourceId }: IndexpageRowProps) => {
  const trpcUtils = trpc.useUtils()
  const { mutateAsync, isLoading } = trpc.folder.createIndexPage.useMutation()

  const { data } = trpc.folder.getIndexpage.useQuery(
    {
      siteId,
      resourceId,
    },
    {
      onError: (err) => {
        if (err.data?.code === "NOT_FOUND") {
          void mutateAsync({ siteId, resourceId })
          void trpcUtils.folder.getIndexpage.refetch()
        }
      },
    },
  )

  return (
    <Skeleton w="full" isLoaded={!isLoading}>
      <HStack
        as={Link}
        href={`/sites/${siteId}/pages/${data?.id}`}
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
        <BiFile fontSize={"1.25rem"} />
        <VStack flex={1} gap="0.25rem" alignItems="flex-start">
          <HStack gap="0.25rem">
            <Text textStyle="subhead-2">{data?.title}</Text>
            <Badge
              size="xs"
              variant="clear"
              colorScheme={data?.draftBlobId ? "warning" : "success"}
            >
              <BadgeLeftIcon fontSize="0.5rem" as={BiSolidCircle} />
              <Text textStyle="legal">
                {data?.draftBlobId
                  ? ResourceState.Draft
                  : ResourceState.Published}
              </Text>
            </Badge>
          </HStack>
          {/*   TODO: we require the last updated at and to display it */}
          {/* as a relative time. */}
          {/* we also need to give the user who did the update */}
          <Text textStyle="caption-2" textColor="base.content.medium">
            Customise the index page for this folder
          </Text>
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
          aria-label="edit index page"
        />
      </HStack>
    </Skeleton>
  )
}
