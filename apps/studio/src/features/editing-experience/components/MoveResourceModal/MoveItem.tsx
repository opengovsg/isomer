import { Suspense } from "react"
import { Text } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { QueryErrorResetBoundary } from "@tanstack/react-query"
import { ErrorBoundary } from "react-error-boundary"
import { BiFolder } from "react-icons/bi"

import type { RouterOutput } from "~/utils/trpc"

type MoveItemProps = Pick<
  RouterOutput["resource"]["getFolderChildrenOf"]["items"][number],
  "permalink"
> & {
  onChangeResourceId: () => void
  isDisabled?: boolean
  isHighlighted?: boolean
  setHighlightedSelectedResourceId: () => void
}

const getButtonProps = ({
  isHighlighted,
  onChangeResourceId,
  setHighlightedSelectedResourceId,
}: MoveItemProps) => {
  if (isHighlighted) {
    return {
      color: "interaction.main.default",
      bg: "interaction.muted.main.active",
      _hover: {
        color: "interaction.main.default",
        bg: "interaction.muted.main.active",
      },
      onClick: onChangeResourceId,
    }
  }

  return {
    color: "base.content.default",
    onClick: setHighlightedSelectedResourceId,
  }
}

const SuspendableMoveItem = ({
  permalink,
  onChangeResourceId,
  isHighlighted,
  setHighlightedSelectedResourceId,
  ...rest
}: MoveItemProps) => {
  const buttonProps = getButtonProps({
    isHighlighted,
    onChangeResourceId,
    setHighlightedSelectedResourceId,
    permalink,
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
      onClick={buttonProps.onClick}
      leftIcon={<BiFolder />}
      {...rest}
    >
      <Text noOfLines={1} textStyle="caption-1" textAlign="left">
        /{permalink}
      </Text>
    </Button>
  )
}

export const MoveItem = (props: MoveItemProps) => {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={({ resetErrorBoundary }) => (
            <div>
              There was an error!
              <Button onClick={() => resetErrorBoundary()}>Try again</Button>
            </div>
          )}
        >
          <Suspense>
            <SuspendableMoveItem {...props} />
          </Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  )
}
