import { Flex } from "@chakra-ui/react"
import { RestrictedGovtMasthead } from "@opengovsg/design-system-react"

import { PublicPageWrapper } from "~/components/AuthWrappers"
import { LandingLinks } from "~/components/LandingLinks"
import { RestrictedMiniFooter } from "~/components/RestrictedMiniFooter"
import {
  BaseGridLayout,
  CurrentLoginStep,
  FooterGridArea,
  LoginGridArea,
  LoginImageSvgr,
  NonMobileFooterLeftGridArea,
  NonMobileSidebarGridArea,
  SignInContextProvider,
} from "~/features/sign-in/components"
import { type NextPageWithLayout } from "~/lib/types"

const SignIn: NextPageWithLayout = () => {
  return (
    <PublicPageWrapper strict>
      <Flex w="100%" flexDir="column" h="inherit" minH="$100vh">
        <RestrictedGovtMasthead />
        <BaseGridLayout flex={1}>
          <NonMobileSidebarGridArea>
            <LoginImageSvgr aria-hidden />
          </NonMobileSidebarGridArea>

          <LoginGridArea>
            <SignInContextProvider>
              <CurrentLoginStep />
            </SignInContextProvider>
          </LoginGridArea>

          <NonMobileFooterLeftGridArea>
            <RestrictedMiniFooter />
          </NonMobileFooterLeftGridArea>

          <FooterGridArea>
            <LandingLinks />
          </FooterGridArea>
        </BaseGridLayout>
      </Flex>
    </PublicPageWrapper>
  )
}

export default SignIn
