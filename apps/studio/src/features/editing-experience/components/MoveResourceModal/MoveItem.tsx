import { Suspense, useMemo } from "react"
import { Text } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { QueryErrorResetBoundary } from "@tanstack/react-query"
import { useAtomValue } from "jotai"
import { ErrorBoundary } from "react-error-boundary"
import { BiData, BiFile, BiFolder, BiHome } from "react-icons/bi"

import type { RouterOutput } from "~/utils/trpc"
import { moveResourceAtom } from "../../atoms"

type MoveItemProps = Pick<
  RouterOutput["resource"]["getChildrenOf"][number],
  "permalink" | "type"
> & {
  onChangeResourceId: () => void
  resourceId: string
}

const SuspendableMoveItem = ({
  permalink,
  resourceId,
  type,
  onChangeResourceId,
}: MoveItemProps) => {
  const movedItem = useAtomValue(moveResourceAtom)
  const icon: JSX.Element = useMemo(() => {
    switch (type) {
      case "Folder":
        return <BiFolder />
      case "CollectionPage":
      case "Page":
        return <BiFile />
      case "RootPage":
        return <BiHome />
      case "Collection":
        return <BiData />
    }
  }, [permalink, type])

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
      <Text textStyle="caption-1">/{permalink}</Text>
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
