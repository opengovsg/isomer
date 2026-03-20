import type { BoxProps } from "@chakra-ui/react"
import { Box } from "@chakra-ui/react"
import React from "react"

export const TableHeader = ({ children, ...props }: BoxProps) => {
  return (
    <Box px="1rem" {...props}>
      {children}
    </Box>
  )
}
