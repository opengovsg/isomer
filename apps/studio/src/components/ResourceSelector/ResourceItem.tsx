import { Suspense } from "react"
import { Box, Icon, Text } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { QueryErrorResetBoundary } from "@tanstack/react-query"
import { ErrorBoundary } from "react-error-boundary"

import type { ResourceItemContent } from "~/schemas/resource"
import { getIcon } from "~/utils/resources"

interface ResourceItemProps {
  item: ResourceItemContent
  isDisabled?: boolean
  isHighlighted: boolean
  handleOnClick: () => void
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

const SuspendableResourceItem = ({
  item,
  isDisabled,
  isHighlighted,
  handleOnClick,
}: ResourceItemProps) => {
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
      onClick={() => handleOnClick()}
      leftIcon={<Icon as={getIcon(item.type)} />}
      isDisabled={isDisabled}
    >
      <Text noOfLines={1} textStyle="caption-1" textAlign="left">
        /{item.permalink}
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
