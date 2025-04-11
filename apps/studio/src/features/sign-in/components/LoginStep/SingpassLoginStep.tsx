import { Stack, Text } from "@chakra-ui/react"

import { SingpassLoginButton } from "../SingpassLogin"

export const SingpassLoginStep = (): JSX.Element => {
  return (
    <Stack gap="2rem" direction="column" width="100%">
      <Text color="base.content.brand" textStyle="h3-semibold">
        Authenticate with Singpass
      </Text>
      <SingpassLoginButton />
    </Stack>
  )
}
