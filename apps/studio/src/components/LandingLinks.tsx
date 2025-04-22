import { HStack, Link } from "@chakra-ui/react"

export const LandingLinks = (): JSX.Element => {
  return (
    <HStack spacing="1.5rem">
      <Link
        title="View privacy statement"
        href="https://www.isomer.gov.sg/privacy"
        variant="standalone"
        colorScheme="neutral"
        textStyle="caption-2"
        target="_blank"
      >
        Privacy
      </Link>

      <Link
        title="View terms of use"
        href="https://www.isomer.gov.sg/terms-of-use"
        variant="standalone"
        colorScheme="neutral"
        textStyle="caption-2"
        target="_blank"
      >
        Terms of Use
      </Link>

      <Link
        title="Report vulnerability"
        href="https://go.gov.sg/report-vulnerability"
        variant="standalone"
        colorScheme="neutral"
        textStyle="caption-2"
        target="_blank"
      >
        Report Vulnerability
      </Link>
    </HStack>
  )
}
