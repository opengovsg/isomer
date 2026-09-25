import type { ControlProps, RankedTester } from "@jsonforms/core"
import { Box, Flex, FormControl } from "@chakra-ui/react"
import { rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { Badge, FormLabel, Radio } from "@opengovsg/design-system-react"
import {
  HERO_ACTION_LAYOUT,
  HERO_ACTION_LAYOUT_FORMAT,
} from "@opengovsg/isomer-components"
import {
  IconHeroActionLayoutButtons,
  IconHeroActionLayoutQuickActions,
} from "~/components/icons"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

// TODO: Merge with JsonFormsChildPageLayoutControl — same titled layout + preview pattern.

/** DS Radio wraps label + preview; suppress full-card focus ring on click. */
const heroActionLayoutRadioCss = {
  _focusWithin: {
    boxShadow: "none",
    outline: "none",
  },
}

export const jsonFormsHeroActionLayoutControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.HeroActionLayoutControl,
  schemaMatches(
    (schema) => schema.format === HERO_ACTION_LAYOUT_FORMAT,
  ),
)

function JsonFormsHeroActionLayoutControl({
  data,
  label,
  handleChange,
  path,
  description,
}: ControlProps): JSX.Element {
  return (
    <Box>
      <FormControl isRequired gap="0.5rem">
        <FormLabel description={description}>{label || "Layout"}</FormLabel>
        <Radio.RadioGroup
          display="flex"
          flexDir="row"
          gap={2}
          onChange={(value) => {
            handleChange(path, value)
          }}
          value={data as string}
        >
          <Radio
            value={HERO_ACTION_LAYOUT.buttons}
            allowDeselect={false}
            size="sm"
            __css={heroActionLayoutRadioCss}
          >
            Buttons only
            <IconHeroActionLayoutButtons mt="10px" />
          </Radio>
          <Radio
            value={HERO_ACTION_LAYOUT.quickActions}
            allowDeselect={false}
            size="sm"
            __css={heroActionLayoutRadioCss}
          >
            <Flex alignItems="center" gap="8px">
              Quick actions
              <Badge variant="subtle" colorScheme="success" size="xs">
                New
              </Badge>
            </Flex>
            <IconHeroActionLayoutQuickActions mt="10px" />
          </Radio>
        </Radio.RadioGroup>
      </FormControl>
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsHeroActionLayoutControl)
