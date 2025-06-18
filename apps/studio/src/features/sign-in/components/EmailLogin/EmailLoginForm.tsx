import { useCallback } from "react"
import { useGrowthBook } from "@growthbook/growthbook-react"

import type { VfnStepData } from "../SignInContext"
import type { GrowthbookAttributes } from "~/types/growthbook"
import { useSignInContext } from "../SignInContext"
import { EmailInput } from "./EmailInput"

export const EmailLoginForm = () => {
  const { setVfnStepData, proceedToVerification } = useSignInContext()
  const gb = useGrowthBook()

  const handleOnSuccessEmail = useCallback(
    ({ email, otpPrefix }: VfnStepData) => {
      setVfnStepData({ email, otpPrefix })

      const newAttributes: Partial<GrowthbookAttributes> = {
        email,
      }

      void gb.updateAttributes(newAttributes)
      proceedToVerification()
    },
    [gb, proceedToVerification, setVfnStepData],
  )

  return <EmailInput onSuccess={handleOnSuccessEmail} />
}
