import { Suspense } from "react"
import { Box, Icon, Skeleton, Text, VStack } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { QueryErrorResetBoundary } from "@tanstack/react-query"
import { ErrorBoundary } from "react-error-boundary"

import type { ResourceItemContent } from "~/schemas/resource"
import { getIcon } from "~/utils/resources"

interface ResourceItemProps {
  item: ResourceItemContent
  isDisabled?: boolean
  isHighlighted?: boolean
  handleOnClick?: () => void
  hasAdditionalLeftPadding?: boolean
  isLoading?: boolean
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
  isHighlighted = false,
  handleOnClick,
  hasAdditionalLeftPadding = false,
  isLoading = false,
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
      {...(hasAdditionalLeftPadding && { pl: "2.25rem" })}
      onClick={() => handleOnClick()}
      leftIcon={<Icon as={getIcon(item.type)} />}
      isDisabled={isDisabled}
      height="fit-content"
      alignItems="flex-start"
      gap="0.25rem"
    >
      <VStack alignItems="flex-start" textAlign="left" gap="0.25rem">
        {isLoading ? (
          <>
            <Skeleton width="12rem" height="1.125rem" variant="pulse" />
            <Skeleton width="18rem" height="1.125rem" variant="pulse" />
          </>
        ) : (
          <>
            <Text noOfLines={1} textStyle="caption-1">
              {item.title}
            </Text>
            <Text noOfLines={1} textStyle="caption-2">
              {`/${item.permalink}`}
            </Text>
          </>
        )}
      </VStack>
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
