import { useEffect, useState } from "react"
import NextLink from "next/link"
import { useRouter } from "next/router"
import {
  Box,
  Flex,
  Grid,
  GridItem,
  Link,
  Text,
  useDisclosure,
} from "@chakra-ui/react"
import {
  Button,
  Infobox,
  RestrictedGovtMasthead,
} from "@opengovsg/design-system-react"
import { BiChevronLeft } from "react-icons/bi"

import type { NextPageWithLayout } from "~/lib/types"
import { PublicPageWrapper } from "~/components/AuthWrappers"
import { FullscreenSpinner } from "~/components/FullscreenSpinner"
import { IsomerLogo } from "~/components/Svg"
import { ISOMER_SUPPORT_LINK } from "~/constants/misc"
import { SingpassLoginButton } from "~/features/sign-in/components"
import { UnableToUseSignpassModal } from "~/features/sign-in/components/UnableToUseSignpassModal"
import { SIGN_IN } from "~/lib/routes"
import { trpc } from "~/utils/trpc"

const SingpassSignInPage: NextPageWithLayout = () => {
  const [isSingpassError, setIsSingpassError] = useState<boolean>()
  const {
    isOpen: isUnableToUseSingpassModalOpen,
    onOpen: openUnableToUseSingpassModal,
    onClose: closeUnableToUseSingpassModal,
  } = useDisclosure()
  const router = useRouter()
  const { data, isLoading, isError } =
    trpc.auth.singpass.getUserProps.useQuery()

  const handleBackToLogin = async () => {
    await router.push(SIGN_IN)
  }

  useEffect(() => {
    if (isError) {
      void router.push(`${SIGN_IN}?error=Unable to retrieve user data`)
    }
  }, [isError, router])

  useEffect(() => {
    if (router.query.error) {
      setIsSingpassError(true)
    }
  }, [router.query.error])

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
            minW="19.5rem"
          >
            <Flex w="100%" flexDir="column" alignItems="start" gap="1.75rem">
              <IsomerLogo />

              {isSingpassError && (
                <Infobox variant="error" w="full" size="sm">
                  <Box>
                    <Text textStyle="subhead-2" color="base.content.strong">
                      We couldn’t authenticate you.
                    </Text>

                    <Text textStyle="body-2" color="base.content.strong">
                      Please try again later. If the issue persists, reach out
                      to{" "}
                      <Link
                        as={NextLink}
                        variant="inline"
                        href={ISOMER_SUPPORT_LINK}
                        color="base.content.strong"
                      >
                        Isomer Support
                      </Link>
                      .
                    </Text>
                  </Box>
                </Infobox>
              )}

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

                <Button
                  variant="link"
                  colorScheme="neutral"
                  textDecoration="underline"
                  onClick={openUnableToUseSingpassModal}
                  textStyle="body-2"
                  color="base.content.medium"
                  w="full"
                  justifyContent="start"
                  textAlign="left"
                >
                  Can’t use Singpass to authenticate?
                </Button>
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
