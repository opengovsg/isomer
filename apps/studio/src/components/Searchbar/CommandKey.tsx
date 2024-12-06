import type { TextProps } from "@chakra-ui/react";
import { Text } from "@chakra-ui/react"

import { isMac } from "./isMac"

export const CommandKey = (props: TextProps) => (
  <Text
    textStyle="caption-1"
    textColor="base.content.medium"
    bg="white"
    py="0.125rem"
    px="0.375rem"
    borderRadius="base"
    border="1px solid"
    borderColor="base.divider.medium"
    {...props}
  >
    {isMac ? "⌘ + K" : "Ctrl + K"}
  </Text>
)
