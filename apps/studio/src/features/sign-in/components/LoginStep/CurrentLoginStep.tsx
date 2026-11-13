import { Flex } from "@chakra-ui/react"
import { useRouter } from "next/router"
import { useEffect, useMemo } from "react"

import { useSignInContext } from "../SignInContext"
import { InitialLoginStep } from "./InitialLoginStep"
import { OneGovSgLoginStep } from "./OneGovSgLoginStep"
import { VerificationLoginStep } from "./VerificationLoginStep"

export const CurrentLoginStep = (): JSX.Element => {
  const router = useRouter()
  const { state, proceedToOneGovSg } = useSignInContext()

  // Menlo pairs isolated tabs through window.name; a stale value sends the
  // next one.gov.sg login back here in a loop.
  useEffect(() => {
    window.name = ""
  }, [])

  // The one.gov.sg app launcher opens /sign-in?iss=…
  const hasLauncherIss = typeof router.query.iss === "string"
  useEffect(() => {
    if (hasLauncherIss) {
      proceedToOneGovSg()
    }
  }, [hasLauncherIss, proceedToOneGovSg])

  const stepToRender = useMemo(() => {
    switch (state) {
      case "initial":
        return <InitialLoginStep />
      case "verification":
        return <VerificationLoginStep />
      case "oneGovSg":
        return <OneGovSgLoginStep />
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
