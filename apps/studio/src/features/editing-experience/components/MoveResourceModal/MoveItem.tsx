import { Suspense, useMemo } from "react"
import { Text } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { QueryErrorResetBoundary } from "@tanstack/react-query"
import { ErrorBoundary } from "react-error-boundary"
import { BiFile, BiFolder } from "react-icons/bi"

import type { RouterOutput } from "~/utils/trpc"

type MoveItemProps = Pick<
  RouterOutput["resource"]["getFolderChildrenOf"]["items"][number],
  "permalink" | "type"
> & {
  onChangeResourceId: () => void
}

const SuspendableMoveItem = ({
  permalink,
  type,
  onChangeResourceId,
}: MoveItemProps) => {
  const icon: JSX.Element = useMemo(() => {
    switch (type) {
      case "Folder":
        return <BiFolder />
      case "RootPage":
        return <BiFile />
    }
  }, [type])

  return (
    <Button
      variant="clear"
      w="full"
      justifyContent="flex-start"
      color="base.content.default"
      // NOTE: Set special styling because pages should show normally
      // but have no onClick
      // TODO: add permissions for folders that users have no access to
      // These should have disabled styling
      _disabled={{ color: "base.content.default" }}
      disabled
      pl="2.25rem"
      onClick={onChangeResourceId}
      leftIcon={icon}
    >
      <Text noOfLines={1} textStyle="caption-1">
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
