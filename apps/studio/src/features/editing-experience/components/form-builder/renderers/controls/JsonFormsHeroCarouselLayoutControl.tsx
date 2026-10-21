import type { ControlProps, RankedTester } from "@jsonforms/core"
import { Box, FormControl } from "@chakra-ui/react"
import { and, isAnyOfControl, rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { FormLabel, Radio } from "@opengovsg/design-system-react"
import {
  HERO_CAROUSEL_CONTENT_ALIGNMENT,
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

type HeroCarouselContentAlignment =
  (typeof HERO_CAROUSEL_CONTENT_ALIGNMENT)[keyof typeof HERO_CAROUSEL_CONTENT_ALIGNMENT]

interface HeroCarouselData {
  layout: HeroCarouselLayout
  contentAlignment?: HeroCarouselContentAlignment
}

// TODO: This control is purely duplicative of JsonFormsChildPageLayoutControl.tsx;
// combine into a shared illustrated radio-group control driven by schema format/options.
export const jsonFormsHeroCarouselLayoutControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.HeroCarouselLayoutControl,
  and(
    isAnyOfControl,
    schemaMatches((schema) => schema.format === HERO_CAROUSEL_FORMAT),
  ),
)

function JsonFormsHeroCarouselLayoutControl({
  data,
  handleChange,
  path,
}: ControlProps): JSX.Element {
  const { layout, contentAlignment } = data as HeroCarouselData

  return (
    <Box>
      <FormControl isRequired gap="0.5rem">
        <FormLabel
          color="base.content.default"
          description="Check the desktop layout in Fullscreen, under preview options"
        >
          Layout
        </FormLabel>
        <Radio.RadioGroup
          display="flex"
          flexDir="row"
          gap={2}
          onChange={(value) => {
            handleChange(
              path,
              value === HERO_CAROUSEL_LAYOUT.gradient
                ? {
                    layout: value,
                    contentAlignment: HERO_CAROUSEL_CONTENT_ALIGNMENT.left,
                  }
                : { layout: value as HeroCarouselLayout },
            )
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
      {layout === HERO_CAROUSEL_LAYOUT.gradient && (
        <FormControl isRequired gap="0.5rem" mt="1rem">
          <FormLabel color="base.content.default">Content alignment</FormLabel>
          <Radio.RadioGroup
            display="flex"
            flexDir="row"
            gap={4}
            onChange={(value) => {
              handleChange(path, {
                ...data,
                contentAlignment: value as HeroCarouselContentAlignment,
              })
            }}
            value={contentAlignment}
          >
            <Radio
              value={HERO_CAROUSEL_CONTENT_ALIGNMENT.left}
              allowDeselect={false}
              size="sm"
            >
              Left
            </Radio>
            <Radio
              value={HERO_CAROUSEL_CONTENT_ALIGNMENT.center}
              allowDeselect={false}
              size="sm"
            >
              Center
            </Radio>
          </Radio.RadioGroup>
        </FormControl>
      )}
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsHeroCarouselLayoutControl)
