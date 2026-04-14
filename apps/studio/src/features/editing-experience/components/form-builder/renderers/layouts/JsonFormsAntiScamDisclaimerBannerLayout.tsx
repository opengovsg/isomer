import type { LayoutProps, RankedTester } from "@jsonforms/core"
import { Box, FormControl, VStack } from "@chakra-ui/react"
import { rankWith } from "@jsonforms/core"
import { withJsonFormsLayoutProps } from "@jsonforms/react"
import { FormLabel } from "@opengovsg/design-system-react"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

export const jsonFormsAntiScamDisclaimerBannerLayoutTester: RankedTester =
  rankWith(
    // Must beat the default VerticalLayout renderer (rank 1)
    JSON_FORMS_RANKING.VerticalLayoutRenderer + 1,
    (uischema, schema) => {
      if (uischema.type !== "VerticalLayout") return false
      const typeSchema = (
        schema.properties as Record<string, unknown> | undefined
      )?.type as { const?: unknown } | undefined
      return typeSchema?.const === "antiscambanner"
    },
  )

// NOTE: This is a Studio-only, display-only renderer.
//
// The anti-scam banner's copy is intentionally NOT configurable by end users (or per-site);
// it is baked into the component itself. However, editors still need to see the some values
// in Studio to avoid confusion. So we hardcode the values here and render them via JSON Forms.
//
// We intentionally do NOT rely on schema `default` + `readOnly` fields for this, because
// Studio runs AJV with `useDefaults: true` which can materialize defaults into the saved page
// JSON even when marked read-only, making it look like these are user-configurable settings.
function JsonFormsAntiScamDisclaimerBannerLayout({ visible }: LayoutProps) {
  if (!visible) return null

  return (
    <VStack alignItems="stretch" gap="1.25rem">
      <Box>
        <FormControl isRequired>
          <FormLabel mb="0.5rem">Title</FormLabel>
        </FormControl>
        <Box textStyle="body-1" color="base.content.default">
          Government officials will never ask you to transfer money over a phone
          call.
        </Box>
      </Box>

      <Box>
        <FormControl isRequired>
          <FormLabel mb="0.5rem">Description</FormLabel>
        </FormControl>
        <Box textStyle="body-1" color="base.content.default">
          If you're unsure if something is a scam, call ScamShield at 1799.
        </Box>
      </Box>
    </VStack>
  )
}

export default withJsonFormsLayoutProps(JsonFormsAntiScamDisclaimerBannerLayout)
