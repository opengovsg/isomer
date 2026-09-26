import type { ControlProps, JsonSchema, RankedTester } from "@jsonforms/core"
import { Box, Flex, FormControl } from "@chakra-ui/react"
import { Generate, rankWith, schemaMatches } from "@jsonforms/core"
import { JsonFormsDispatch, withJsonFormsControlProps } from "@jsonforms/react"
import { Badge, FormLabel, Radio } from "@opengovsg/design-system-react"
import {
  HERO_ACTION_LAYOUT,
  HERO_ACTION_LAYOUT_FORMAT,
} from "@opengovsg/isomer-components"
import {
  IconHeroActionLayoutButtons,
  IconHeroActionLayoutQuickActions,
} from "~/components/icons"
import {
  createDefaultHeroActionLayoutQuickActionItem,
  HERO_QUICK_ACTIONS_DEFAULT_TITLE,
  HERO_QUICK_ACTIONS_MIN_ITEMS,
} from "~/components/PageEditor/constants"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

/** DS Radio wraps label + preview; suppress full-card focus ring on click. */
const heroActionLayoutRadioCss = {
  _focusWithin: {
    boxShadow: "none",
    outline: "none",
  },
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

const branchLayout = (branch: JsonSchema) => {
  const actionLayout = branch.properties?.actionLayout
  if (!actionLayout || typeof actionLayout !== "object") {
    return undefined
  }

  return "const" in actionLayout && typeof actionLayout.const === "string"
    ? actionLayout.const
    : undefined
}

const layoutSpecificFieldKeys = (branch: JsonSchema): string[] => {
  const properties = branch.properties
  if (!properties || typeof properties !== "object") {
    return []
  }

  return Object.keys(properties).filter((key) => key !== "actionLayout")
}

/** Property keys owned by branches other than the selected layout. */
const heroActionLayoutKeysToDrop = (
  branches: JsonSchema[],
  selectedLayout: string,
): string[] => {
  const keys = new Set<string>()

  for (const branch of branches) {
    const branchActionLayout = branchLayout(branch)
    if (branchActionLayout === selectedLayout) {
      continue
    }

    for (const key of layoutSpecificFieldKeys(branch)) {
      keys.add(key)
    }
  }

  return [...keys]
}

/** Keep shared hero fields. Drop the layout that was not selected. */
export const nextHeroActionLayoutData = (
  current: unknown,
  layout: string,
  branches: JsonSchema[],
) => {
  const kept = isRecord(current) ? { ...current } : {}

  for (const key of heroActionLayoutKeysToDrop(branches, layout)) {
    delete kept[key]
  }

  return {
    ...kept,
    actionLayout: layout,
    ...(layout === HERO_ACTION_LAYOUT.quickActions
      ? {
          quickActionsTitle: HERO_QUICK_ACTIONS_DEFAULT_TITLE,
          showIcon: true,
          quickActionsItems: Array.from(
            { length: HERO_QUICK_ACTIONS_MIN_ITEMS },
            () => createDefaultHeroActionLayoutQuickActionItem(),
          ),
        }
      : {}),
  }
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
  const selectedLayout =
    isRecord(data) && data.actionLayout === HERO_ACTION_LAYOUT.quickActions
      ? HERO_ACTION_LAYOUT.quickActions
      : HERO_ACTION_LAYOUT.buttons
  const branches = Array.isArray(schema.oneOf) ? schema.oneOf : []
  const selectedBranch =
    branches.find((branch) => branchLayout(branch) === selectedLayout) ??
    branches[0]

  const onChange = (layout: string) => {
    handleChange(path, nextHeroActionLayoutData(data, layout, branches))
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
          renderers={renderers}
          cells={cells}
        />
      )}
    </>
  )
}

export default withJsonFormsControlProps(JsonFormsHeroActionLayoutControl)
