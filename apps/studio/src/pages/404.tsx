import { Flex, Stack, Text } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import Image from "next/image"
import NextLink from "next/link"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import {
  getNotFoundCtaFromPath,
  ALL_SITES_CTA,
} from "~/components/ErrorBoundary/getNotFoundCta"
import { RestrictedMiniFooter } from "~/components/RestrictedMiniFooter"

// https://nextjs.org/docs/advanced-features/custom-error-page
const Custom404 = () => {
  const router = useRouter()

  // This page has no data fetching, so Next prerenders it at build time with
  // `asPath` fixed to "/404", while the client router reports the URL the user
  // actually asked for. Deriving the CTA after mount keeps the first client
  // render identical to the prerendered markup instead of tripping a
  // hydration mismatch.
  const [cta, setCta] = useState(ALL_SITES_CTA)

  useEffect(() => {
    setCta(getNotFoundCtaFromPath(router.asPath))
  }, [router.asPath])

  return (
    <Flex flexDirection="column" w="100%" flex={1}>
      <Flex
        flex={1}
        bg="base.canvas.backdrop"
        align="end"
        justify="center"
        px="1rem"
      >
        <Image
          style={{ maxWidth: "100%" }}
          aria-hidden
          width="283"
          height="240"
          src="/assets/404.svg"
          alt="404 image"
        />
      </Flex>
      <Stack
        px="1rem"
        flex={1}
        flexDirection="column"
        justify="space-between"
        align="center"
        py="4.5rem"
      >
        <Stack align="center" spacing="0.75rem">
          <Text textStyle="h5" as="h1">
            This page could not be found
          </Text>
          <Text textStyle="body-2" textAlign="center">
            Double check to ensure that the URL is correct.
          </Text>
          <Button mt="0.5rem" as={NextLink} href={cta.href}>
            {cta.label}
          </Button>
        </Stack>
        <RestrictedMiniFooter
        // This component can only be used if this is an application created by OGP.
        />
      </Stack>
    </Flex>
  )
}

export default Custom404
