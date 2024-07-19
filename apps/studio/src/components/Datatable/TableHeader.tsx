import type { BoxProps } from "@chakra-ui/react"
import React from "react"
import { Box } from "@chakra-ui/react"

export const TableHeader = ({ children, ...props }: BoxProps) => {
  return (
    <Box px="1rem" {...props}>
      {children}
    </Box>
  )
}
