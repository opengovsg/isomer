import { useEffect, useMemo, useState } from "react"
import { Accordion, AccordionItem, AccordionPanel } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { ResourceType } from "~prisma/generated/generatedEnums"

import { getResourceSubpath } from "~/utils/resource"
import { getIcon } from "~/utils/resources"
import { trpc } from "~/utils/trpc"
import { RowEntry } from "./RowEntry"
import { useIsActive } from "./useIsActive"

interface DirectorySidebarContentProps {
  level: number
  siteId: string
  resourceId: string | null
  defaultIndex?: number
  item: {
    permalink: string
    type: ResourceType
  }
  subLabel?: string
}

export const DirectorySidebarContent = ({
  siteId,
  resourceId,
  item,
  defaultIndex,
  level,
  subLabel,
}: DirectorySidebarContentProps) => {
  const [expandedIndex, setExpandedIndex] = useState<number | undefined>(
    defaultIndex,
  )

  const isActive = useIsActive(resourceId, item.type)

  const href = useMemo(() => {
    if (item.type === ResourceType.RootPage) {
      return `/sites/${siteId}`
    }
    return `/sites/${siteId}/${getResourceSubpath(item.type)}/${resourceId}`
  }, [siteId, item.type, resourceId])

  const isExpandable =
    item.type === ResourceType.Folder ||
    item.type === ResourceType.Collection ||
    item.type === ResourceType.RootPage

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
            icon={getIcon(item.type)}
            label={`/${item.permalink}`}
            isFetchingChildren={isFetchingChildren}
            isActive={isActive}
            isExpandable={isExpandable}
            level={level}
            subLabel={subLabel}
          />
          {hasChildren && (
            <AccordionPanel
              p={0}
              display="flex"
              flexDirection="column"
              gap="2px"
            >
              {data?.pages.map((page) =>
                page.items.map((item) => {
                  return (
                    <DirectorySidebarContent
                      key={item.id}
                      siteId={siteId}
                      resourceId={item.id}
                      item={item}
                      level={level + 1}
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
      icon={getIcon(item.type)}
      label={`/${item.permalink}`}
      isActive={isActive}
      isExpandable={isExpandable}
      level={level}
      subLabel={subLabel}
    />
  )
}
