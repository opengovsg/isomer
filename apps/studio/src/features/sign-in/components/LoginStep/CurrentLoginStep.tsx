import { useMemo } from "react"
import { Flex } from "@chakra-ui/react"

import { useSignInContext } from "../SignInContext"
import { EmailLoginStep } from "./EmailLoginStep"
import { InitialLoginStep } from "./InitialLoginStep"
import { SingpassLoginStep } from "./SingpassLoginStep"

export const CurrentLoginStep = (): JSX.Element => {
  const { state } = useSignInContext()

  const stepToRender = useMemo(() => {
    switch (state) {
      case "initial":
        return <InitialLoginStep />
      case "email":
        return <EmailLoginStep />
      case "singpass":
        return <SingpassLoginStep />
      default:
        const _: never = state
        return <></>
    }
  }, [state])

  return (
    // Fixed height so the page can be (relatively) centered without any layout shift.
    <Flex w="100%" h={{ lg: "16rem" }}>
      {stepToRender}
    </Flex>
  )
}
