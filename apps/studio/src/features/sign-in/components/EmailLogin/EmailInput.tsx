import { useEffect } from "react"
import { useRouter } from "next/router"
import { FormControl, Stack } from "@chakra-ui/react"
import {
  Button,
  FormErrorMessage,
  FormLabel,
  Input,
} from "@opengovsg/design-system-react"

import { useZodForm } from "~/lib/form"
import { emailSignInSchema } from "~/schemas/auth/email/sign-in"
import { trpc } from "~/utils/trpc"
import { type VfnStepData } from "../SignInContext"

interface EmailInputProps {
  onSuccess: (props: VfnStepData) => void
}

export const EmailInput: React.FC<EmailInputProps> = ({ onSuccess }) => {
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
    onError: (error) => setError("email", { message: error.message }),
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
          <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
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
