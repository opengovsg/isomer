import type { GrowthbookAttributes } from "~/types/growthbook"
import { useGrowthBook } from "@growthbook/growthbook-react"
import { useCallback } from "react"

import type { VfnStepData } from "../SignInContext"
import { useSignInContext } from "../SignInContext"
import { EmailInput } from "./EmailInput"

export const EmailLoginForm = () => {
  const { setVfnStepData, proceedToVerification, resetTimer } =
    useSignInContext()
  const gb = useGrowthBook()

  const handleOnSuccessEmail = useCallback(
    ({ email, otpPrefix }: VfnStepData) => {
      setVfnStepData({ email, otpPrefix })
      resetTimer()

      const newAttributes: Partial<GrowthbookAttributes> = {
        email,
      }

      void gb.updateAttributes(newAttributes)
      proceedToVerification()
    },
    [gb, proceedToVerification, resetTimer, setVfnStepData],
  )

  return <EmailInput onSuccess={handleOnSuccessEmail} />
}
