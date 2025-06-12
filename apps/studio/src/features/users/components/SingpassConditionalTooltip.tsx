import type { TooltipProps } from "@chakra-ui/react"
import { Tooltip } from "@chakra-ui/react"

import { SINGPASS_DISABLED_ERROR_MESSAGE } from "~/constants/customErrorMessage"

interface SingpassConditionalTooltipProps extends Omit<TooltipProps, "label"> {
  isSingpassEnabled: boolean
  children: React.ReactNode
}

export const SingpassConditionalTooltip = ({
  children,
  isSingpassEnabled,
  ...tooltipProps
}: SingpassConditionalTooltipProps) => {
  if (isSingpassEnabled) {
    return children
  }

  return (
    <Tooltip label={SINGPASS_DISABLED_ERROR_MESSAGE} {...tooltipProps}>
      {children}
    </Tooltip>
  )
}
