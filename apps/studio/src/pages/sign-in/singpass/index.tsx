import { useRouter } from "next/router"
import { Flex, Grid, GridItem, Text, useDisclosure } from "@chakra-ui/react"
import { Button, RestrictedGovtMasthead } from "@opengovsg/design-system-react"
import { BiChevronLeft } from "react-icons/bi"

import type { NextPageWithLayout } from "~/lib/types"
import { PublicPageWrapper } from "~/components/AuthWrappers"
import { FullscreenSpinner } from "~/components/FullscreenSpinner"
import { IsomerLogo } from "~/components/Svg"
import { SingpassLoginButton } from "~/features/sign-in/components"
import { UnableToUseSignpassModal } from "~/features/sign-in/components/UnableToUseSignpassModal"
import { SIGN_IN } from "~/lib/routes"
import { trpc } from "~/utils/trpc"

const SingpassSignInPage: NextPageWithLayout = () => {
  const {
    isOpen: isUnableToUseSingpassModalOpen,
    onOpen: openUnableToUseSingpassModal,
    onClose: closeUnableToUseSingpassModal,
  } = useDisclosure()
  const router = useRouter()
  const { data, isLoading } = trpc.auth.singpass.getName.useQuery()

  const handleBackToLogin = async () => {
    await router.push(SIGN_IN)
  }

  if (isLoading || !data) {
    return <FullscreenSpinner />
  }

  const { name, isNewUser } = data

  return (
    <PublicPageWrapper strict>
      <UnableToUseSignpassModal
        isOpen={isUnableToUseSingpassModalOpen}
        onClose={closeUnableToUseSingpassModal}
      />

      <Flex w="100%" flexDir="column" minH="$100vh">
        <RestrictedGovtMasthead />

        <Grid
          templateColumns="repeat(12, 1fr)"
          gap="0"
          h="100%"
          w="100%"
          placeItems="center"
          bgColor="base.canvas.alt"
        >
          <GridItem
            bgColor="white"
            gridColumnStart={5}
            gridColumn="5 / 9"
            borderRadius="md"
            border="1px solid"
            borderColor="base.divider.medium"
            px="1.75rem"
            py="2rem"
          >
            <Flex w="100%" flexDir="column" alignItems="start" gap="1.75rem">
              <IsomerLogo />

              <Flex w="100%" flexDir="column" gap="0.75rem">
                <Text textStyle="subhead-1" color="base.content.default">
                  {isNewUser
                    ? "Set up Two-Factor Authentication (2FA) with Singpass to secure your account"
                    : `Welcome back, ${name}! Authenticate your identity with Singpass to log in`}
                </Text>

                <Text textStyle="body-2" color="base.content.default">
                  {isNewUser
                    ? "This will be required to log in to Isomer Studio in the future"
                    : "You’ll need your Singpass app or credentials"}
                </Text>

                <Text textStyle="body-2" color="base.content.default">
                  <Button
                    variant="link"
                    colorScheme="neutral"
                    textDecoration="underline"
                    onClick={openUnableToUseSingpassModal}
                  >
                    Can’t use Singpass to authenticate?
                  </Button>
                </Text>
              </Flex>

              <Flex w="100%" flexDir="column" gap="0.75rem">
                <SingpassLoginButton />

                <Button
                  w="full"
                  variant="clear"
                  onClick={handleBackToLogin}
                  leftIcon={<BiChevronLeft />}
                >
                  {isNewUser ? "Back to login" : "Not you?"}
                </Button>
              </Flex>
            </Flex>
          </GridItem>
        </Grid>
      </Flex>
    </PublicPageWrapper>
  )
}

export default SingpassSignInPage
