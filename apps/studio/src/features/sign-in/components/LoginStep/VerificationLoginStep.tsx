import { Box, Stack, Text } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"

import { IsomerLogo } from "~/components/Svg"
import { VerificationInput } from "../EmailLogin/VerificationInput"
import { useSignInContext } from "../SignInContext"

export const VerificationLoginStep = (): JSX.Element => {
  const { backToInitial, vfnStepData } = useSignInContext()

  return (
    <Stack w="100%" gap="1rem">
      <Box>
        <IsomerLogo />
      </Box>

      <Text color="base.content.strong" textStyle="subhead-1">
        We’ve sent an OTP to {vfnStepData?.email}.{" "}
        <Button
          variant="link"
          colorScheme="blue"
          textDecoration="underline"
          onClick={backToInitial}
        >
          Use a different email
        </Button>
        .
      </Text>

      <VerificationInput />
    </Stack>
  )
}
