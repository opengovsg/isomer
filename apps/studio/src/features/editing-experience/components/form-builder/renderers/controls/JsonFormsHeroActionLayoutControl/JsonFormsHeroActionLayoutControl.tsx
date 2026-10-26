import type { ControlProps, RankedTester } from "@jsonforms/core"
import type {
  HeroActionLayout,
  HeroGradientProps,
} from "@opengovsg/isomer-components"
import { Box, Flex, FormControl } from "@chakra-ui/react"
import { Generate, rankWith, schemaMatches } from "@jsonforms/core"
import { JsonFormsDispatch, withJsonFormsControlProps } from "@jsonforms/react"
import { Badge, FormLabel, Radio } from "@opengovsg/design-system-react"
import {
  HERO_ACTION_LAYOUT,
  HERO_ACTION_LAYOUT_FORMAT,
} from "@opengovsg/isomer-components"
import { useMemo } from "react"
import {
  IconHeroActionLayoutButtons,
  IconHeroActionLayoutQuickActions,
} from "~/components/icons"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

import { nextHeroActionLayoutData } from "../../../utils/nextHeroActionLayoutData"
import { actionLayoutTextRenderer } from "./TextControl"

/** DS Radio wraps label + preview; suppress full-card focus ring on click. */
const heroActionLayoutRadioCss = {
  _focusWithin: {
    boxShadow: "none",
    outline: "none",
  },
}

export const jsonFormsHeroActionLayoutControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.HeroActionLayoutControl,
  schemaMatches((schema) => schema.format === HERO_ACTION_LAYOUT_FORMAT),
)

function JsonFormsHeroActionLayoutControl({
  data,
  label,
  handleChange,
  path,
  description,
  schema,
  rootSchema,
  enabled,
  renderers,
  cells,
}: ControlProps): JSX.Element {
  const heroData = data as Partial<HeroGradientProps> | undefined
  const selectedLayout = heroData?.actionLayout ?? HERO_ACTION_LAYOUT.buttons
  const selectedBranch = schema.oneOf?.find(
    (branch) => branch.properties?.actionLayout?.const === selectedLayout,
  )
  // Scoped override: text fields in the layout (incl. quick action items) show builder errors.
  const layoutRenderers = useMemo(
    () => [actionLayoutTextRenderer, ...(renderers ?? [])],
    [renderers],
  )

  const onChange = (layout: HeroActionLayout) => {
    if (layout === selectedLayout) {
      return
    }

    handleChange(path, nextHeroActionLayoutData(heroData, layout))
  }

  return (
    <>
      <Box>
        <FormControl isRequired gap="0.5rem">
          <FormLabel description={description}>{label || "Layout"}</FormLabel>
          <Radio.RadioGroup
            display="flex"
            flexDir="row"
            gap={2}
            onChange={onChange}
            value={selectedLayout}
          >
            <Radio
              value={HERO_ACTION_LAYOUT.buttons}
              allowDeselect={false}
              size="sm"
              __css={heroActionLayoutRadioCss}
            >
              Buttons only
              <IconHeroActionLayoutButtons aria-hidden mt="10px" />
            </Radio>
            <Radio
              value={HERO_ACTION_LAYOUT.quickActions}
              allowDeselect={false}
              size="sm"
              __css={heroActionLayoutRadioCss}
            >
              <Flex alignItems="center" gap="8px">
                Quick actions
                <Badge
                  variant="subtle"
                  colorScheme="success"
                  size="xs"
                  bg="interaction.success-subtle.default"
                >
                  New
                </Badge>
              </Flex>
              <IconHeroActionLayoutQuickActions aria-hidden mt="10px" />
            </Radio>
          </Radio.RadioGroup>
        </FormControl>
      </Box>
      {selectedBranch && (
        <JsonFormsDispatch
          uischema={Generate.uiSchema(
            selectedBranch,
            "VerticalLayout",
            undefined,
            rootSchema,
          )}
          schema={selectedBranch}
          path={path}
          enabled={enabled}
          renderers={layoutRenderers}
          cells={cells}
        />
      )}
    </>
  )
}

export default withJsonFormsControlProps(JsonFormsHeroActionLayoutControl)
