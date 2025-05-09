import type { PropsWithChildren } from "react"
import { Box } from "@chakra-ui/react"

interface DisableProps {
  when?: boolean
}

export const Disable = ({
  when,
  children,
}: PropsWithChildren<DisableProps>): JSX.Element => {
  return when ? (
    // NOTE: This is done so that the cursor has the disabled icon
    // while not permitting any `onClick` events.
    // Combining them into the same element leads to
    // the cursor icon being active.
    <Box cursor="not-allowed" w="full" h="full">
      <Box pointerEvents="none" w="full" h="full">
        {children}
      </Box>
    </Box>
  ) : (
    <>{children}</>
  )
}
