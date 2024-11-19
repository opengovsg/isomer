import type { IconType } from "react-icons"
import { Suspense } from "react"
import { Box, Icon, Text } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { QueryErrorResetBoundary } from "@tanstack/react-query"
import { ResourceType } from "~prisma/generated/generatedEnums"
import { ErrorBoundary } from "react-error-boundary"
import { BiData, BiFile, BiFolder, BiLink } from "react-icons/bi"

import type { RouterOutput } from "~/utils/trpc"

type ResourceItemProps = Pick<
  RouterOutput["resource"]["getFolderChildrenOf"]["items"][number],
  "permalink"
> & {
  handleOnClick: () => void
  type: ResourceType | undefined
  isDisabled?: boolean
  isHighlighted: boolean
}

const getButtonProps = ({ isHighlighted }: { isHighlighted: boolean }) => {
  if (isHighlighted) {
    return {
      color: "interaction.main.default",
      bg: "interaction.muted.main.active",
      _hover: {
        color: "interaction.main.default",
        bg: "interaction.muted.main.active",
      },
    }
  }

  return {
    color: "base.content.default",
  }
}

const getButtonIcon = ({
  type,
}: {
  type: ResourceType | undefined
}): IconType => {
  switch (type) {
    case ResourceType.CollectionLink:
      return BiLink
    case ResourceType.Folder:
      return BiFolder
    case ResourceType.CollectionPage:
    case ResourceType.Page:
      return BiFile
    case ResourceType.Collection:
      return BiData
    default:
      return BiData // Default to data icon
  }
}

const SuspendableResourceItem = ({
  permalink,
  isHighlighted,
  handleOnClick,
  ...rest
}: ResourceItemProps) => {
  const { type, ...restWithoutType } = rest

  const buttonProps = getButtonProps({
    isHighlighted,
  })

  return (
    <Button
      variant="clear"
      w="full"
      justifyContent="flex-start"
      color={buttonProps.color}
      bg={buttonProps.bg}
      {...(buttonProps._hover && {
        _hover: {
          color: buttonProps._hover.color,
          bg: buttonProps._hover.bg,
        },
      })}
      pl="2.25rem"
      size="xs"
      onClick={handleOnClick}
      leftIcon={<Icon as={getButtonIcon({ type })} />}
      {...restWithoutType}
    >
      <Text noOfLines={1} textStyle="caption-1" textAlign="left">
        /{permalink}
      </Text>
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
