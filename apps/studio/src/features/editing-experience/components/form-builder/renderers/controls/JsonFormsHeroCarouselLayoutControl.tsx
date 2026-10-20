import type { ControlProps, RankedTester } from "@jsonforms/core"
import { Box, FormControl } from "@chakra-ui/react"
import { and, isObjectControl, rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { FormLabel, Radio } from "@opengovsg/design-system-react"
import {
  HERO_CAROUSEL_FORMAT,
  HERO_CAROUSEL_LAYOUT,
} from "@opengovsg/isomer-components"
import {
  IconHeroCarouselBlock,
  IconHeroCarouselGradient,
} from "~/components/icons"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

type HeroCarouselLayout =
  (typeof HERO_CAROUSEL_LAYOUT)[keyof typeof HERO_CAROUSEL_LAYOUT]

interface HeroCarouselData {
  layout: HeroCarouselLayout
}

// TODO: This control is purely duplicative of JsonFormsChildPageLayoutControl.tsx;
// combine into a shared illustrated radio-group control driven by schema format/options.
export const jsonFormsHeroCarouselLayoutControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.HeroCarouselLayoutControl,
  and(
    isObjectControl,
    schemaMatches((schema) => schema.format === HERO_CAROUSEL_FORMAT),
  ),
)

function JsonFormsHeroCarouselLayoutControl({
  data,
  label,
  handleChange,
  path,
  description,
}: ControlProps): JSX.Element {
  const carousel = data as HeroCarouselData | undefined
  // Display-only fallback when no value is stored yet (schema defaults are
  // avoided because AJV's `useDefaults` would dirty saved pages).
  const layout = carousel?.layout ?? HERO_CAROUSEL_LAYOUT.block

  return (
    <Box>
      <FormControl isRequired gap="0.5rem">
        <FormLabel color="base.content.default" description={description}>
          {label || "Layout"}
        </FormLabel>
        <Radio.RadioGroup
          display="flex"
          flexDir="row"
          gap={2}
          onChange={(value) => {
            handleChange(path, {
              ...carousel,
              layout: value as HeroCarouselLayout,
            })
          }}
          value={layout}
        >
          <Radio
            value={HERO_CAROUSEL_LAYOUT.block}
            allowDeselect={false}
            size="sm"
          >
            Block
            <IconHeroCarouselBlock mt="10px" />
          </Radio>
          <Radio
            value={HERO_CAROUSEL_LAYOUT.gradient}
            allowDeselect={false}
            size="sm"
          >
            Gradient
            <IconHeroCarouselGradient mt="10px" />
          </Radio>
        </Radio.RadioGroup>
      </FormControl>
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsHeroCarouselLayoutControl)
