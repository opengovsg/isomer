import type { IconType } from "react-icons"
import { Suspense, useMemo } from "react"
import { Box, HStack, Icon, Mark, Text } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { QueryErrorResetBoundary } from "@tanstack/react-query"
import fuzzysort from "fuzzysort"
import { ErrorBoundary } from "react-error-boundary"
import { BiData, BiFile, BiFolder, BiHome, BiLockAlt } from "react-icons/bi"

import type { RouterOutput } from "~/utils/trpc"

type ResourceItemProps = Pick<
  RouterOutput["resource"]["getChildrenOf"][number],
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
      case "RootPage":
        return BiHome
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
      color={isSelected ? "interaction.main.default" : "base.content.default"}
      bgColor={isSelected ? "interaction.muted.main.active" : undefined}
      isDisabled={isDisabled}
      _active={{
        bgColor: !isDisabled ? "interaction.tinted.main.active" : undefined,
      }}
      _disabled={{ color: "interaction.support.disabled-content" }}
      _hover={{
        bgColor:
          !isSelected && !isDisabled
            ? "interaction.muted.main.hover"
            : undefined,
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
          <Suspense>
            <SuspendableResourceItem {...props} />
          </Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  )
}
