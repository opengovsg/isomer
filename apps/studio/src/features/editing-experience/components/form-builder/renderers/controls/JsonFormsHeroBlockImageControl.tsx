import type { ControlProps, RankedTester } from "@jsonforms/core"
import { Box, Flex, FormControl, VStack } from "@chakra-ui/react"
import { and, isObjectControl, rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { FormLabel, Radio } from "@opengovsg/design-system-react"
import {
  HERO_BLOCK_IMAGE_EDGE,
  HERO_BLOCK_IMAGE_FORMAT,
  HERO_BLOCK_IMAGE_POSITION,
  type HeroBlockProps,
} from "@opengovsg/isomer-components"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { NewFeatureBadge } from "~/features/editing-experience/components/shared/NewFeatureBadge"

import {
  HeroBlockImagePreviewLeftCurvedIcon,
  HeroBlockImagePreviewLeftStraightIcon,
  HeroBlockImagePreviewRightCurvedIcon,
  HeroBlockImagePreviewRightStraightIcon,
} from "./heroBlockImagePreview"

type HeroBlockImageData = NonNullable<HeroBlockProps["blockImage"]>

export const jsonFormsHeroBlockImageControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.HeroBlockImageControl,
  and(
    isObjectControl,
    schemaMatches((schema) => schema.format === HERO_BLOCK_IMAGE_FORMAT),
  ),
)

function JsonFormsHeroBlockImageControl({
  data,
  handleChange,
  path,
}: ControlProps): JSX.Element {
  const blockImage = data as HeroBlockImageData | undefined
  // Display-only fallbacks when no value is stored yet (schema defaults are
  // avoided because AJV's `useDefaults` would dirty saved pages).
  const imagePosition =
    blockImage?.imagePosition ?? HERO_BLOCK_IMAGE_POSITION.right
  const imageEdge = blockImage?.imageEdge ?? HERO_BLOCK_IMAGE_EDGE.straight

  const updateBlockImage = (patch: Partial<HeroBlockImageData>) => {
    handleChange(path, {
      imagePosition: patch.imagePosition ?? imagePosition,
      imageEdge: patch.imageEdge ?? imageEdge,
    })
  }

  return (
    <VStack align="stretch" gap="1.25rem" w="full">
      <FormControl isRequired gap="0.5rem">
        <FormLabel>Image position</FormLabel>
        <Radio.RadioGroup
          display="flex"
          flexDir="row"
          gap={2}
          value={imagePosition}
          onChange={(value) => {
            updateBlockImage({
              imagePosition: value as HeroBlockImageData["imagePosition"],
            })
          }}
        >
          <Radio
            value={HERO_BLOCK_IMAGE_POSITION.right}
            allowDeselect={false}
            size="sm"
          >
            Right
          </Radio>
          <Radio
            value={HERO_BLOCK_IMAGE_POSITION.left}
            allowDeselect={false}
            size="sm"
          >
            <Flex as="span" align="center">
              Left
              <NewFeatureBadge />
            </Flex>
          </Radio>
        </Radio.RadioGroup>
      </FormControl>

      <FormControl isRequired gap="0.5rem">
        <FormLabel description="Check the desktop layout in Fullscreen, under preview options">
          Image edge
        </FormLabel>
        <Radio.RadioGroup
          display="flex"
          flexDir="row"
          gap={2}
          value={imageEdge}
          onChange={(value) => {
            updateBlockImage({
              imageEdge: value as HeroBlockImageData["imageEdge"],
            })
          }}
        >
          <Radio
            value={HERO_BLOCK_IMAGE_EDGE.straight}
            allowDeselect={false}
            size="sm"
          >
            Straight
            <Box mt="0.625rem">
              {imagePosition === HERO_BLOCK_IMAGE_POSITION.left ? (
                <HeroBlockImagePreviewLeftStraightIcon />
              ) : (
                <HeroBlockImagePreviewRightStraightIcon />
              )}
            </Box>
          </Radio>
          <Radio
            value={HERO_BLOCK_IMAGE_EDGE.curved}
            allowDeselect={false}
            size="sm"
          >
            <Flex as="span" align="center">
              Curved
              <NewFeatureBadge />
            </Flex>
            <Box mt="0.625rem">
              {imagePosition === HERO_BLOCK_IMAGE_POSITION.left ? (
                <HeroBlockImagePreviewLeftCurvedIcon />
              ) : (
                <HeroBlockImagePreviewRightCurvedIcon />
              )}
            </Box>
          </Radio>
        </Radio.RadioGroup>
      </FormControl>
    </VStack>
  )
}

export default withJsonFormsControlProps(JsonFormsHeroBlockImageControl)
