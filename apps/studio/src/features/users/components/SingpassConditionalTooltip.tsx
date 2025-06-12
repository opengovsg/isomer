import type { TooltipProps } from "@chakra-ui/react"
import { Tooltip } from "@chakra-ui/react"

import { SINGPASS_DISABLED_ERROR_MESSAGE } from "~/constants/customErrorMessage"
import { useIsSingpassEnabled } from "~/hooks/useIsSingpassEnabled"

interface SingpassConditionalTooltipProps extends Omit<TooltipProps, "label"> {
  children: React.ReactNode
}

export const SingpassConditionalTooltip = ({
  children,
  ...tooltipProps
}: SingpassConditionalTooltipProps) => {
  if (useIsSingpassEnabled()) {
    return children
  }

  return (
    <Tooltip label={SINGPASS_DISABLED_ERROR_MESSAGE} {...tooltipProps}>
      {children}
    </Tooltip>
  )
}
