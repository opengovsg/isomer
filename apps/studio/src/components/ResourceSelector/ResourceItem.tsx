import type { IconType } from "react-icons"
import { Suspense, useMemo } from "react"
import { Box, HStack, Icon, Mark, Skeleton, Text } from "@chakra-ui/react"
import { dataAttr } from "@chakra-ui/utils"
import { Button } from "@opengovsg/design-system-react"
import { QueryErrorResetBoundary } from "@tanstack/react-query"
import fuzzysort from "fuzzysort"
import { ErrorBoundary } from "react-error-boundary"
import { BiData, BiFile, BiFolder, BiLockAlt } from "react-icons/bi"

import type { RouterOutput } from "~/utils/trpc"

type ResourceItemProps = Pick<
  RouterOutput["resource"]["getChildrenOf"]["items"][number],
  "permalink" | "type"
> & {
  isSelected: boolean
  isDisabled: boolean
  searchQuery: string
  onResourceItemSelect: () => void
}

const SuspendableResourceItem = ({
  permalink,
  type,
  isSelected,
  isDisabled,
  searchQuery,
  onResourceItemSelect,
}: ResourceItemProps) => {
  const icon: IconType = useMemo(() => {
    switch (type) {
      case "Folder":
        return BiFolder
      case "CollectionPage":
      case "Page":
        return BiFile
      case "Collection":
        return BiData
    }
  }, [type])

  const SearchTextHighlight = useMemo(() => {
    const result = fuzzysort.single(searchQuery, permalink)
    if (!result) {
      return permalink
    }

    return fuzzysort.highlight(result, (m, i) => (
      <Mark key={i} bgColor="interaction.tinted.main.active">
        {m}
      </Mark>
    ))
  }, [searchQuery, permalink])

  return (
    <Button
      variant="clear"
      w="full"
      justifyContent="flex-start"
      color="base.content.default"
      isDisabled={isDisabled}
      data-selected={dataAttr(isSelected)}
      _selected={{
        color: "interaction.main.default",
        bgColor: "interaction.muted.main.active",
        _hover: {
          bgColor: "unset",
        },
      }}
      _active={{
        bgColor: "interaction.tinted.main.active",
      }}
      _disabled={{
        color: "interaction.support.disabled-content",
        bgColor: "unset",
        cursor: "not-allowed",
        _hover: {
          bgColor: "unset",
        },
      }}
      _hover={{
        bgColor: "interaction.muted.main.hover",
      }}
      pl="2.25rem"
      py="0.375rem"
      borderRadius="0.25rem"
      onClick={onResourceItemSelect}
      leftIcon={<Icon as={icon} />}
    >
      <HStack align="start" w="full" justify="space-between">
        <Text textStyle="caption-1" noOfLines={1}>
          /{SearchTextHighlight}
        </Text>
        {isDisabled && <Icon as={BiLockAlt} fontSize="0.75rem" />}
      </HStack>
    </Button>
  )
}

export const ResourceItem = (props: ResourceItemProps) => {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={({ resetErrorBoundary }) => (
            <Box>
              There was an error!
              <Button onClick={() => resetErrorBoundary()}>Try again</Button>
            </Box>
          )}
        >
          <Suspense fallback={<Skeleton />}>
            <SuspendableResourceItem {...props} />
          </Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  )
}
