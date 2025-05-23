import { useState } from "react"
import { useRouter } from "next/router"
import {
  FormControl,
  InputGroup,
  InputLeftAddon,
  Stack,
} from "@chakra-ui/react"
import {
  Button,
  FormErrorMessage,
  FormLabel,
  Infobox,
  Input,
} from "@opengovsg/design-system-react"
import { Controller } from "react-hook-form"
import { useInterval } from "usehooks-ts"

import { CALLBACK_URL_KEY } from "~/constants/params"
import { useLoginState } from "~/features/auth"
import { useIsSingpassEnabled } from "~/hooks/useIsSingpassEnabled"
import { OTP_LENGTH } from "~/lib/auth"
import { useZodForm } from "~/lib/form"
import { SIGN_IN_SINGPASS } from "~/lib/routes"
import { emailVerifyOtpSchema } from "~/schemas/auth/email/sign-in"
import { callbackUrlSchema } from "~/schemas/url"
import { trpc } from "~/utils/trpc"
import { useSignInContext } from "../SignInContext"
import { ResendOtpButton } from "./ResendOtpButton"

export const VerificationInput = (): JSX.Element | null => {
  const [showOtpDelayMessage, setShowOtpDelayMessage] = useState(false)
  const { setHasLoginStateFlag } = useLoginState()
  const router = useRouter()
  const utils = trpc.useUtils()

  const { vfnStepData, timer, setVfnStepData, resetTimer } = useSignInContext()

  const isSingpassEnabled = useIsSingpassEnabled()

  useInterval(
    () => setShowOtpDelayMessage(true),
    // Show otp delay info message after 15 seconds.
    showOtpDelayMessage ? null : 15000,
  )

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    resetField,
    setFocus,
    setError,
  } = useZodForm({
    schema: emailVerifyOtpSchema,
    defaultValues: {
      email: vfnStepData?.email ?? "",
      token: "",
    },
  })

  const verifyOtpMutation = trpc.auth.email.verifyOtp.useMutation({
    onSuccess: async () => {
      if (isSingpassEnabled) {
        await router.push(SIGN_IN_SINGPASS)
      } else {
        setHasLoginStateFlag()
        await utils.me.get.invalidate()
        // accessing router.query values returns decoded URI params automatically,
        // so there's no need to call decodeURIComponent manually when accessing the callback url.
        await router.push(
          callbackUrlSchema.parse(router.query[CALLBACK_URL_KEY]),
        )
      }
    },
    onError: (error) => {
      switch (error.message) {
        case "Token is invalid or has expired":
          setError("token", {
            message:
              "This OTP is invalid or has expired, click resend OTP to get a new one",
          })
          break
        case "Too many attempts":
          setError("token", {
            message:
              "You have attempted the wrong OTP too many times, click resend OTP to get a new one",
          })
          break
        default:
          setError("token", { message: error.message })
      }
    },
  })

  const resendOtpMutation = trpc.auth.email.login.useMutation({
    onError: (error) => setError("token", { message: error.message }),
  })

  const handleVerifyOtp = handleSubmit(({ email, token }) => {
    return verifyOtpMutation.mutate({ email, token })
  })

  const handleResendOtp = () => {
    if (timer > 0 || !vfnStepData?.email) return
    return resendOtpMutation.mutate(
      { email: vfnStepData.email },
      {
        onSuccess: ({ email, otpPrefix }) => {
          setVfnStepData({ email, otpPrefix })
          resetField("token")
          setFocus("token")
          // On success, restart the timer before this can be called again.
          resetTimer()
        },
      },
    )
  }

  if (!vfnStepData) return null

  return (
    <form onSubmit={handleVerifyOtp}>
      <Stack direction="column" spacing="1rem">
        <FormControl
          id="email"
          isInvalid={!!errors.token}
          isReadOnly={verifyOtpMutation.isLoading}
          isRequired
        >
          <FormLabel htmlFor="email">Enter OTP</FormLabel>
          <Controller
            control={control}
            name="token"
            render={({ field: { onChange, value, ...field } }) => (
              <InputGroup>
                <InputLeftAddon
                  bgColor="interaction.support.disabled"
                  color="interaction.support.disabled-content"
                >
                  {vfnStepData.otpPrefix}-
                </InputLeftAddon>
                <Input
                  autoFocus
                  autoCapitalize="true"
                  autoCorrect="false"
                  autoComplete="one-time-code"
                  placeholder="ABC123"
                  maxLength={OTP_LENGTH}
                  {...field}
                  value={value}
                  onChange={(e) => onChange(e.target.value.toUpperCase())}
                />
              </InputGroup>
            )}
          />
          <FormErrorMessage>{errors.token?.message}</FormErrorMessage>
        </FormControl>
        <Stack direction="column" spacing="0.75rem">
          <Button
            size="sm"
            height="2.75rem"
            type="submit"
            // Want to keep loading state until redirection is complete.
            isLoading={
              verifyOtpMutation.isLoading || verifyOtpMutation.isSuccess
            }
            isDisabled={!isValid}
          >
            Sign in
          </Button>
          {showOtpDelayMessage && (
            <Infobox size="sm">
              OTP might be delayed due to government email traffic. Try again
              later.
            </Infobox>
          )}
          <ResendOtpButton
            alignSelf="end"
            timer={timer}
            onClick={handleResendOtp}
            isDisabled={timer > 0 || verifyOtpMutation.isLoading}
            isLoading={resendOtpMutation.isLoading}
            spinnerFontSize="1rem"
            _loading={{
              justifyContent: "flex-end",
            }}
          />
        </Stack>
      </Stack>
    </form>
  )
}
