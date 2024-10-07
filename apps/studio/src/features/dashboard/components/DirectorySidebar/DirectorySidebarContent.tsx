import { useEffect, useMemo, useState } from "react"
import { Accordion, AccordionItem, AccordionPanel } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"

import type { ResourceType } from "~prisma/generated/generatedEnums"
import { getResourceSubpath } from "~/utils/resource"
import { trpc } from "~/utils/trpc"
import { ICON_MAPPINGS } from "./constants"
import { RowEntry } from "./RowEntry"
import { useIsActive } from "./useIsActive"

interface DirectorySidebarContentProps {
  siteId: string
  resourceId: string | null
  defaultIndex?: number
  item: {
    permalink: string
    type: ResourceType
  }
}

export const DirectorySidebarContent = ({
  siteId,
  resourceId,
  item,
  defaultIndex,
}: DirectorySidebarContentProps) => {
  const [expandedIndex, setExpandedIndex] = useState<number | undefined>(
    defaultIndex,
  )

  const isActive = useIsActive(resourceId, item.type)

  const href = useMemo(() => {
    if (item.type === "RootPage") {
      return `/sites/${siteId}`
    }
    return `/sites/${siteId}/${getResourceSubpath(item.type)}/${resourceId}`
  }, [siteId, item.type, resourceId])

  const isExpandable =
    item.type === "Folder" ||
    item.type === "Collection" ||
    item.type === "RootPage"

  const isEnabled = expandedIndex === 0 || isActive

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    trpc.resource.getChildrenOf.useInfiniteQuery(
      {
        resourceId,
        siteId,
        limit: 25,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextOffset,
        enabled: isEnabled,
      },
    )

  const isFetchingChildren = isLoading && isEnabled
  const hasChildren = data?.pages.some(({ items }) => items.length > 0)

  // Expand on sidebar (if visible) when resource is active
  useEffect(() => {
    if (isActive) {
      setExpandedIndex(0)
    }
  }, [isActive])

  if (isExpandable) {
    return (
      <Accordion
        index={expandedIndex}
        onChange={(expandedIndex) => setExpandedIndex(expandedIndex as number)}
        allowToggle
      >
        <AccordionItem
          _disabled={{
            textColor: "interaction.support.disabled-content",
          }}
          border="none"
        >
          <RowEntry
            href={href}
            icon={ICON_MAPPINGS[item.type]}
            label={item.permalink}
            isFetchingChildren={isFetchingChildren}
            isActive={isActive}
            isExpandable={isExpandable}
          />
          {hasChildren && (
            <AccordionPanel>
              {data?.pages.map((page) =>
                page.items.map((item) => {
                  return (
                    <DirectorySidebarContent
                      key={item.id}
                      siteId={siteId}
                      resourceId={item.id}
                      item={item}
                    />
                  )
                }),
              )}
              {hasNextPage && (
                <Button
                  variant="link"
                  pl="2.75rem"
                  size="xs"
                  isLoading={isFetchingNextPage}
                  onClick={() => fetchNextPage()}
                >
                  Load more
                </Button>
              )}
            </AccordionPanel>
          )}
        </AccordionItem>
      </Accordion>
    )
  }

  return (
    <RowEntry
      href={href}
      icon={ICON_MAPPINGS[item.type]}
      label={item.permalink}
      isActive={isActive}
      isExpandable={isExpandable}
    />
  )
}
