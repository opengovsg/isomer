import type { ControlProps, JsonSchema, RankedTester } from "@jsonforms/core"
import type {
  HeroGradientActionLayout,
  HeroGradientProps,
} from "@opengovsg/isomer-components"
import { Box, Flex, FormControl } from "@chakra-ui/react"
import {
  composePaths,
  Generate,
  rankWith,
  schemaMatches,
} from "@jsonforms/core"
import { JsonFormsDispatch, withJsonFormsControlProps } from "@jsonforms/react"
import { FormLabel, Radio } from "@opengovsg/design-system-react"
import {
  HERO_GRADIENT_ACTION_LAYOUT,
  HERO_ACTION_LAYOUT_FORMAT,
} from "@opengovsg/isomer-components"
import { isEmpty, omit } from "lodash-es"
import { useMemo } from "react"
import {
  IconHeroGradientButtonsLayout,
  IconHeroGradientQuickLinksLayout,
} from "~/components/icons"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { NewFeatureBadge } from "~/features/editing-experience/components/shared/NewFeatureBadge"

import { nextHeroGradientActionLayoutData } from "../../../utils/nextHeroGradientActionLayoutData"
import { actionLayoutLinkRenderer } from "./LinkControl"
import { actionLayoutTextRenderer } from "./TextControl"

/** DS Radio wraps label + preview; suppress full-card focus ring on click. */
const heroActionLayoutRadioCss = {
  _focusWithin: {
    boxShadow: "none",
    outline: "none",
  },
}

// Record keyed by layout: adding a layout fails to compile until it has an option here.
const LAYOUT_OPTIONS: Record<
  HeroGradientActionLayout,
  { label: string; Icon: typeof IconHeroGradientButtonsLayout; isNew: boolean }
> = {
  [HERO_GRADIENT_ACTION_LAYOUT.buttons]: {
    label: "Buttons only",
    Icon: IconHeroGradientButtonsLayout,
    isNew: false,
  },
  [HERO_GRADIENT_ACTION_LAYOUT.quickLinks]: {
    label: "Quick links",
    Icon: IconHeroGradientQuickLinksLayout,
    isNew: true,
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
  const selectedLayout =
    heroData?.actions?.layout ?? HERO_GRADIENT_ACTION_LAYOUT.buttons
  const selectedBranch = schema.oneOf?.find(
    (branch) =>
      branch.properties?.actions?.properties?.layout?.const === selectedLayout,
  )
  // A layout owns fields under `actions` and, for buttons, root CTA fields.
  const actionsSchema = selectedBranch?.properties?.actions
  // Cast: omit() widens the JsonSchema4 | JsonSchema7 properties union.
  const rootFieldsSchema =
    selectedBranch &&
    ({
      ...selectedBranch,
      properties: omit(selectedBranch.properties, "actions"),
    } as JsonSchema)
  // Scoped override: text and link fields in the layout show builder errors JsonForms drops.
  const layoutRenderers = useMemo(
    () => [
      actionLayoutTextRenderer,
      actionLayoutLinkRenderer,
      ...(renderers ?? []),
    ],
    [renderers],
  )

  const onChange = (layout: HeroGradientActionLayout) => {
    if (layout === selectedLayout) {
      return
    }

    handleChange(path, nextHeroGradientActionLayoutData(heroData, layout))
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
            {Object.values(HERO_GRADIENT_ACTION_LAYOUT).map((layout) => {
              const { label: layoutLabel, Icon, isNew } = LAYOUT_OPTIONS[layout]
              return (
                <Radio
                  key={layout}
                  value={layout}
                  allowDeselect={false}
                  size="sm"
                  __css={heroActionLayoutRadioCss}
                >
                  <Flex alignItems="center" gap="8px">
                    {layoutLabel}
                    {isNew && <NewFeatureBadge ml={0} />}
                  </Flex>
                  <Icon aria-hidden mt="10px" />
                </Radio>
              )
            })}
          </Radio.RadioGroup>
        </FormControl>
      </Box>
      {[
        { fieldsSchema: rootFieldsSchema, fieldsPath: path },
        {
          fieldsSchema: actionsSchema,
          fieldsPath: composePaths(path, "actions"),
        },
      ].map(
        ({ fieldsSchema, fieldsPath }) =>
          // Skip empty branches (e.g. quick links has no root fields) so no blank layout adds a gap.
          fieldsSchema &&
          !isEmpty(fieldsSchema.properties) && (
            <JsonFormsDispatch
              key={fieldsPath}
              uischema={Generate.uiSchema(
                fieldsSchema,
                "VerticalLayout",
                undefined,
                rootSchema,
              )}
              schema={fieldsSchema}
              path={fieldsPath}
              enabled={enabled}
              renderers={layoutRenderers}
              cells={cells}
            />
          ),
      )}
    </>
  )
}

export default withJsonFormsControlProps(JsonFormsHeroActionLayoutControl)
