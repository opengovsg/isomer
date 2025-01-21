import type { IconType } from "react-icons"
import { Suspense, useMemo } from "react"
import { Box, HStack, Icon, Skeleton, Text } from "@chakra-ui/react"
import { dataAttr } from "@chakra-ui/utils"
import { Button } from "@opengovsg/design-system-react"
import { QueryErrorResetBoundary } from "@tanstack/react-query"
import { ResourceType } from "~prisma/generated/generatedEnums"
import { ErrorBoundary } from "react-error-boundary"
import { BiData, BiFile, BiFolder, BiLink, BiLockAlt } from "react-icons/bi"

import type { RouterOutput } from "~/utils/trpc"

type ResourceItemProps = Pick<
  RouterOutput["resource"]["getChildrenOf"]["items"][number],
  "permalink" | "type"
> & {
  isSelected: boolean
  isDisabled: boolean
  onResourceItemSelect: () => void
}

const SuspendableResourceItem = ({
  permalink,
  type,
  isSelected,
  isDisabled,
  onResourceItemSelect,
}: ResourceItemProps) => {
  const icon: IconType = useMemo(() => {
    switch (type) {
      case ResourceType.CollectionLink:
        return BiLink
      case ResourceType.Folder:
        return BiFolder
      case ResourceType.CollectionPage:
      case ResourceType.Page:
      case ResourceType.IndexPage:
        return BiFile
      case ResourceType.Collection:
        return BiData
    }
  }, [type])

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
          /{permalink}
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
