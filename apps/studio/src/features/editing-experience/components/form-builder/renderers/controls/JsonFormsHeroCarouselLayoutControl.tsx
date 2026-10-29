import type { ControlProps, RankedTester } from "@jsonforms/core"
import { Box, FormControl } from "@chakra-ui/react"
import { and, isAnyOfControl, rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { FormLabel, Radio } from "@opengovsg/design-system-react"
import {
  HERO_BLOCK_IMAGE_POSITION,
  HERO_CAROUSEL_CONTENT_ALIGNMENT,
  HERO_CAROUSEL_FORMAT,
  HERO_CAROUSEL_LAYOUT,
  type HeroCarouselContentAlignment,
  type HeroCarouselImagePosition,
  type HeroCarouselLayout,
} from "@opengovsg/isomer-components"
import {
  IconHeroCarouselBlockLeft,
  IconHeroCarouselBlockRight,
  IconHeroCarouselGradientCenter,
  IconHeroCarouselGradientLeft,
} from "~/components/icons"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

interface HeroCarouselData {
  layout: HeroCarouselLayout
  contentAlignment?: HeroCarouselContentAlignment
  imagePosition: HeroCarouselImagePosition
}

// Same tracks for every row so the second option stays put when layout swaps.
const optionColumns = {
  display: "grid",
  w: "full",
  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
  columnGap: 2,
  alignItems: "start",
} as const

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
  const { layout, contentAlignment, imagePosition } = data as HeroCarouselData

  return (
    <Box>
      <FormControl isRequired gap="0.5rem">
        <FormLabel
          color="base.content.default"
          description="Check the desktop layout in Full screen, under preview options"
        >
          Layout
        </FormLabel>
        <Radio.RadioGroup
          {...optionColumns}
          onChange={(value) => {
            handleChange(
              path,
              value === HERO_CAROUSEL_LAYOUT.gradient
                ? {
                    layout: value,
                    contentAlignment: HERO_CAROUSEL_CONTENT_ALIGNMENT.left,
                  }
                : {
                    layout: HERO_CAROUSEL_LAYOUT.block,
                    imagePosition: HERO_BLOCK_IMAGE_POSITION.right,
                  },
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
            <IconHeroCarouselBlockRight mt="10px" />
          </Radio>
          <Radio
            value={HERO_CAROUSEL_LAYOUT.gradient}
            allowDeselect={false}
            size="sm"
          >
            Gradient
            <IconHeroCarouselGradientLeft mt="10px" />
          </Radio>
        </Radio.RadioGroup>
      </FormControl>
      {layout === HERO_CAROUSEL_LAYOUT.block && (
        <FormControl isRequired gap="0.5rem" mt="1rem">
          <FormLabel color="base.content.default">Image position</FormLabel>
          <Radio.RadioGroup
            {...optionColumns}
            onChange={(value) => {
              handleChange(path, {
                layout: HERO_CAROUSEL_LAYOUT.block,
                imagePosition: value as HeroCarouselImagePosition,
              })
            }}
            value={imagePosition}
          >
            <Radio
              value={HERO_BLOCK_IMAGE_POSITION.right}
              allowDeselect={false}
              size="sm"
            >
              Right
              <IconHeroCarouselBlockRight mt="10px" />
            </Radio>
            <Radio
              value={HERO_BLOCK_IMAGE_POSITION.left}
              allowDeselect={false}
              size="sm"
            >
              Left
              <IconHeroCarouselBlockLeft mt="10px" />
            </Radio>
          </Radio.RadioGroup>
        </FormControl>
      )}
      {layout === HERO_CAROUSEL_LAYOUT.gradient && (
        <FormControl isRequired gap="0.5rem" mt="1rem">
          <FormLabel color="base.content.default">Content alignment</FormLabel>
          <Radio.RadioGroup
            {...optionColumns}
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
              <IconHeroCarouselGradientLeft mt="10px" />
            </Radio>
            <Radio
              value={HERO_CAROUSEL_CONTENT_ALIGNMENT.center}
              allowDeselect={false}
              size="sm"
            >
              Center
              <IconHeroCarouselGradientCenter mt="10px" />
            </Radio>
          </Radio.RadioGroup>
        </FormControl>
      )}
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsHeroCarouselLayoutControl)
