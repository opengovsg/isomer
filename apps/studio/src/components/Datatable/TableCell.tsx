import type { TextProps } from "@chakra-ui/react"
import React from "react"
import { Text } from "@chakra-ui/react"

export const TableCell = ({ children, ...props }: TextProps) => {
  return <Text {...props}>{children}</Text>
}
