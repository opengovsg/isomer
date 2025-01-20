import { Suspense } from "react"
import { Text } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { QueryErrorResetBoundary } from "@tanstack/react-query"
import { ErrorBoundary } from "react-error-boundary"
import { BiData, BiFolder } from "react-icons/bi"

import type { RouterOutput } from "~/utils/trpc"

type MoveItemProps = Pick<
  RouterOutput["resource"]["getChildrenOf"]["items"][number],
  "permalink" | "type"
> & {
  handleOnClick: () => void
  isDisabled?: boolean
  isHighlighted?: boolean
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

const SuspendableMoveItem = ({
  permalink,
  isHighlighted,
  handleOnClick,
  type,
  ...rest
}: MoveItemProps) => {
  const buttonProps = getButtonProps({
    isHighlighted: !!isHighlighted,
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
      leftIcon={type === "Collection" ? <BiData /> : <BiFolder />}
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
