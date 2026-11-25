import { Flex } from "@chakra-ui/react"
import { RestrictedGovtMasthead } from "@opengovsg/design-system-react"
import { useRouter } from "next/router"
import { PublicPageWrapper } from "~/components/AuthWrappers"
import { LandingLinks } from "~/components/LandingLinks"
import { RestrictedMiniFooter } from "~/components/RestrictedMiniFooter"
import {
  BaseGridLayout,
  CurrentLoginStep,
  FooterGridArea,
  FreshFromIsomerPanel,
  LoginGridArea,
  NonMobileSidebarGridArea,
  SignInContextProvider,
} from "~/features/sign-in/components"
import { type NextPageWithLayout } from "~/lib/types"

const SignIn: NextPageWithLayout = () => {
  const router = useRouter()
  // App-launcher logins (?iss=) skip the localStorage login flag, which can be
  // stale; the one.gov.sg login route checks the real session instead.
  const isLauncherLogin = typeof router.query.iss === "string"

  return (
    <PublicPageWrapper strict={router.isReady && !isLauncherLogin}>
      <Flex w="100%" flexDir="column" h="inherit" minH="$100vh">
        <RestrictedGovtMasthead />
        <BaseGridLayout flex={1}>
          <NonMobileSidebarGridArea>
            <FreshFromIsomerPanel />
          </NonMobileSidebarGridArea>

          <LoginGridArea>
            <SignInContextProvider>
              <CurrentLoginStep />
            </SignInContextProvider>
          </LoginGridArea>

          <FooterGridArea>
            <LandingLinks />
            <RestrictedMiniFooter />
          </FooterGridArea>
        </BaseGridLayout>
      </Flex>
    </PublicPageWrapper>
  )
}

export default SignIn
