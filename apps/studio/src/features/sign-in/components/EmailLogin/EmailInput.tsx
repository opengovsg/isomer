import type { FieldError } from "react-hook-form"
import { useEffect } from "react"
import { useRouter } from "next/router"
import { FormControl, Stack, Text } from "@chakra-ui/react"
import {
  Button,
  FormErrorMessage,
  FormLabel,
  Input,
  Link,
} from "@opengovsg/design-system-react"

import type { VfnStepData } from "../SignInContext"
import { ISOMER_SUPPORT_LINK } from "~/constants/misc"
import { useZodForm } from "~/lib/form"
import { emailSignInSchema } from "~/schemas/auth/email/sign-in"
import { trpc } from "~/utils/trpc"
import { useSignInContext } from "../SignInContext"

const EmailInputErrorMessage = ({ type, message }: Partial<FieldError>) => {
  switch (type) {
    case "INTERNAL_SERVER_ERROR":
      return (
        <Text>
          We are having trouble sending an OTP to this email address.{" "}
          <Link
            href={`${ISOMER_SUPPORT_LINK}?subject=I can't receive OTP on Isomer Studio`}
            color="utility.feedback.critical"
            _hover={{
              color: "unset",
            }}
          >
            Contact Isomer Support
          </Link>
          .
        </Text>
      )
    case "UNAUTHORIZED":
    default:
      return <>{message}</>
  }
}

interface EmailInputProps {
  onSuccess: (props: VfnStepData) => void
}

export const EmailInput: React.FC<EmailInputProps> = ({ onSuccess }) => {
  const { setErrorState } = useSignInContext()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isValid },
  } = useZodForm({
    schema: emailSignInSchema,
  })

  const router = useRouter()

  const loginMutation = trpc.auth.email.login.useMutation({
    onSuccess,
    onError: (error) => {
      if (error.data?.code === "UNAUTHORIZED") {
        setErrorState("unauthorized")
      }

      setError("email", { type: error.data?.code, message: error.message })
    },
  })

  useEffect(() => {
    if (router.query.error) {
      setError("email", { message: String(router.query.error) })
    }
  }, [router.query.error, setError])

  const handleSignIn = handleSubmit(({ email }) => {
    return loginMutation.mutate({ email })
  })

  return (
    <form onSubmit={handleSignIn} noValidate>
      <Stack spacing="1.5rem">
        <FormControl
          id="email"
          isRequired
          isInvalid={!!errors.email}
          isReadOnly={loginMutation.isLoading}
        >
          <FormLabel mb="0.5rem">Email address</FormLabel>
          <Input
            placeholder="e.g. jane@open.gov.sg"
            autoFocus
            {...register("email")}
          />
          <FormErrorMessage>
            <EmailInputErrorMessage
              type={errors.email?.type}
              message={errors.email?.message}
            />
          </FormErrorMessage>
        </FormControl>
        <Button
          size="sm"
          height="2.75rem"
          type="submit"
          isLoading={loginMutation.isLoading}
          isDisabled={!isValid}
        >
          Send One-Time Password (OTP)
        </Button>
      </Stack>
    </form>
  )
}
