import { Box, Stack, Text, VStack } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"

import { IsomerLogo } from "~/components/Svg"
import { VerificationInput } from "../EmailLogin/VerificationInput"
import { useSignInContext } from "../SignInContext"

export const VerificationLoginStep = (): JSX.Element => {
  const { backToInitial, vfnStepData } = useSignInContext()

  return (
    <Stack w="100%" gap="1.5rem">
      <Box>
        <IsomerLogo />
      </Box>

      <VStack w="100%" spacing="0.25rem" alignItems="start">
        <Text color="base.content.strong" textStyle="subhead-1">
          We’ve sent an OTP to {vfnStepData?.email}.
        </Text>

        <Button
          variant="link"
          colorScheme="blue"
          textDecoration="underline"
          onClick={backToInitial}
        >
          <Text textStyle="body-2">Use a different email</Text>
        </Button>
      </VStack>

      <VerificationInput />
    </Stack>
  )
}
