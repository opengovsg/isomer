import { Box, Stack, Text, VStack } from "@chakra-ui/react"

import { IsomerLogo } from "~/components/Svg"
import { useEnv } from "~/hooks/useEnv"
import { useIsSingpassEnabled } from "~/hooks/useIsSingpassEnabled"
import { EmailLoginForm } from "../EmailLogin"

export const InitialLoginStep = (): JSX.Element => {
  const {
    env: { NEXT_PUBLIC_APP_NAME: title },
  } = useEnv()
  const isSingpassEnabled = useIsSingpassEnabled()

  return (
    <Stack gap="1.5rem" direction="column" width="100%">
      <Box>
        <IsomerLogo />
      </Box>

      <VStack spacing="0.25rem" alignItems="start">
        <Text color="base.content.strong" textStyle="subhead-1">
          Welcome back to {title}
        </Text>

        <Text color="base.content.default" textStyle="body-2">
          {isSingpassEnabled
            ? "Use your email to log in. You will need to verify with Singpass after this step."
            : "Use your email to log in."}
        </Text>
      </VStack>

      <EmailLoginForm />
    </Stack>
  )
}
