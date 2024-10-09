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
}

const SuspendableMoveItem = ({
  permalink,
  onChangeResourceId,
  ...rest
}: MoveItemProps) => {
  return (
    <Button
      variant="clear"
      w="full"
      justifyContent="flex-start"
      color="base.content.default"
      pl="2.25rem"
      onClick={onChangeResourceId}
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
