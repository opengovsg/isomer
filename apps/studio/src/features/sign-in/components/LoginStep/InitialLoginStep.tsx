import { Box, Stack, Text, VStack } from "@chakra-ui/react"
import { Infobox, Link } from "@opengovsg/design-system-react"
import { useMemo } from "react"
import { IsomerLogo } from "~/components/Svg"
import { ISOMER_SUPPORT_LINK } from "~/constants/misc"
import { useEnv } from "~/hooks/useEnv"
import { useIsSingpassEnabled } from "~/hooks/useIsSingpassEnabled"

import { EmailLoginForm } from "../EmailLogin"
import { OneGovSgLoginButton } from "../OneGovSgLogin"
import { useSignInContext } from "../SignInContext"

export const InitialLoginStep = (): JSX.Element => {
  const {
    env: { NEXT_PUBLIC_APP_NAME: title },
  } = useEnv()
  const { isSingpassEnabled } = useIsSingpassEnabled()
  const { errorState } = useSignInContext()

  const errorTitle = useMemo(() => {
    switch (errorState) {
      case "unauthorized":
        return "You don’t have access to Isomer Studio"
      case "oneGovSgFailed":
        return "We couldn’t log you in with one.gov.sg"
      default:
        const _: undefined = errorState
        return undefined
    }
  }, [errorState])

  const errorDescription = useMemo(() => {
    switch (errorState) {
      case "unauthorized":
        return (
          <>
            Ask your site’s admin to add you as a user. If you think this is a
            mistake, contact{" "}
            <Link
              variant="inline"
              href={ISOMER_SUPPORT_LINK}
              color="base.content.strong"
            >
              Isomer Support
            </Link>
            .
          </>
        )
      case "oneGovSgFailed":
        return "Try again, or log in with your email address."
      default:
        const _: undefined = errorState
        return undefined
    }
  }, [errorState])

  return (
    <Stack gap="1.5rem" direction="column" width="100%">
      <Box>
        <IsomerLogo />
      </Box>

      {!!errorState && (
        <Infobox variant="error" size="sm">
          <Box>
            <Text textStyle="subhead-2" color="base.content.strong">
              {errorTitle}
            </Text>

            <Text textStyle="body-2" color="base.content.strong">
              {errorDescription}
            </Text>
          </Box>
        </Infobox>
      )}

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

      <OneGovSgLoginButton />
    </Stack>
  )
}
