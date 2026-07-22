import { Flex, Stack, Text } from "@chakra-ui/react"
import { RestrictedMiniFooter } from "~/components/RestrictedMiniFooter"

// The single "link expired" page every failed Download Token redemption lands
// on (ADR 0006): forged/tampered/expired token, unknown row, not Done, or
// window elapsed all 302 here, so the page must not distinguish between them.
// It tells the recipient the link is no longer valid and to request a fresh
// export from their site settings — it deliberately reveals nothing about
// whether a matching export ever existed.
const AuditLogExportExpired = () => {
  return (
    <Flex flexDirection="column" w="100%" flex={1}>
      <Stack
        px="1rem"
        flex={1}
        flexDirection="column"
        justify="space-between"
        align="center"
        py="4.5rem"
      >
        <Stack align="center" spacing="0.75rem" maxW="32rem">
          <Text textStyle="h5" as="h1" textAlign="center">
            This download link has expired
          </Text>
          <Text textStyle="body-1" textAlign="center">
            Audit log export links are valid for a limited time. To download
            your report, sign in to Studio and request a new export from your
            site&apos;s settings.
          </Text>
        </Stack>
        <RestrictedMiniFooter
        // This component can only be used if this is an application created by OGP.
        />
      </Stack>
    </Flex>
  )
}

export default AuditLogExportExpired
