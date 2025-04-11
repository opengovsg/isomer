import type { Dispatch, PropsWithChildren, SetStateAction } from "react"
import { createContext, useCallback, useContext, useState } from "react"
import { useInterval } from "usehooks-ts"

type SignInStateType = "initial" | "verification"
type SignInErrorType = "unauthorized"

interface SignInState {
  timer: number
  resetTimer: () => void
  state: SignInStateType
  errorState: SignInErrorType | undefined
  setErrorState: Dispatch<SetStateAction<SignInErrorType | undefined>>
  vfnStepData: VfnStepData | undefined
  setVfnStepData: Dispatch<SetStateAction<VfnStepData | undefined>>
  proceedToVerification: () => void
  backToInitial: () => void
}

export const SignInContext = createContext<SignInState | undefined>(undefined)

export const useSignInContext = () => {
  const context = useContext(SignInContext)

  if (context === undefined) {
    throw new Error(
      `Must use sign in context within ${SignInContextProvider.name}`,
    )
  }

  return context
}

interface SignInContextProviderProps {
  /**
   * The number of seconds to wait before allowing the user to resend the OTP.
   * @default 60
   */
  delayForResendSeconds?: number
}

export interface VfnStepData {
  email: string
  otpPrefix: string
}

export const SignInContextProvider = ({
  children,
  delayForResendSeconds = 60,
}: PropsWithChildren<SignInContextProviderProps>) => {
  const [state, setState] = useState<SignInStateType>("initial")
  const [errorState, setErrorState] = useState<SignInErrorType>()
  const [vfnStepData, setVfnStepData] = useState<VfnStepData>()
  const [timer, setTimer] = useState(delayForResendSeconds)

  const resetTimer = useCallback(
    () => setTimer(delayForResendSeconds),
    [delayForResendSeconds],
  )

  const proceedToVerification = useCallback(() => {
    setState("verification")
    setErrorState(undefined)
  }, [])

  const backToInitial = useCallback(() => {
    setState("initial")
    setVfnStepData(undefined)
    setErrorState(undefined)
  }, [])

  // Start the resend timer once in the vfn step.
  useInterval(
    () => setTimer(timer - 1),
    // Stop interval if timer hits 0, else rerun every 1000ms.
    !!vfnStepData && timer > 0 ? 1000 : null,
  )

  return (
    <SignInContext.Provider
      value={{
        vfnStepData,
        setVfnStepData,
        timer,
        resetTimer,
        proceedToVerification,
        backToInitial,
        state,
        errorState,
        setErrorState,
      }}
    >
      {children}
    </SignInContext.Provider>
  )
}
