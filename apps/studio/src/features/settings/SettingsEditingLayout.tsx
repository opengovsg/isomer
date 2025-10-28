import { PropsWithChildren } from "react"
import { StackProps, VStack } from "@chakra-ui/react"

export const SettingsEditingLayout = (props: PropsWithChildren<StackProps>) => {
  return (
    <VStack
      align="start"
      {...props}
      spacing="1.5rem"
      px="2rem"
      py="1.5rem"
      w="100%"
      h="100%"
    />
  )
}
