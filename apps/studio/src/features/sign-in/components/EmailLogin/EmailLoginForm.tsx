import { useCallback } from "react"

import type { VfnStepData } from "../SignInContext"
import { useSignInContext } from "../SignInContext"
import { EmailInput } from "./EmailInput"

export const EmailLoginForm = () => {
  const { setVfnStepData, proceedToVerification } = useSignInContext()

  const handleOnSuccessEmail = useCallback(
    ({ email, otpPrefix }: VfnStepData) => {
      setVfnStepData({ email, otpPrefix })
      proceedToVerification()
    },
    [proceedToVerification, setVfnStepData],
  )

  return <EmailInput onSuccess={handleOnSuccessEmail} />
}
