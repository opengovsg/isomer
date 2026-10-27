import type {
  ControlElement,
  LayoutProps,
  RankedTester,
  VerticalLayout,
} from "@jsonforms/core"
import type { InfoCardsProps } from "@opengovsg/isomer-components"
import { Box, FormControl } from "@chakra-ui/react"
import { composePaths, rankWith, update } from "@jsonforms/core"
import {
  JsonFormsDispatch,
  useJsonForms,
  withJsonFormsLayoutProps,
} from "@jsonforms/react"
import { FormLabel, Radio } from "@opengovsg/design-system-react"
import {
  INFOCARDS_DISPLAY,
  INFOCARDS_LAYOUT_FORMAT,
} from "@opengovsg/isomer-components"
import { IconInfoCardsCarousel, IconInfoCardsWrap } from "~/components/icons"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

const DISPLAY_SCOPE = "#/properties/display"
const MAX_COLUMNS_SCOPE = "#/properties/maxColumns"

export const jsonFormsInfoCardsLayoutTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.InfoCardsLayoutRenderer,
  (uischema, schema) =>
    uischema.type === "VerticalLayout" &&
    schema.format === INFOCARDS_LAYOUT_FORMAT,
)

function JsonFormsInfoCardsLayout({
  uischema,
  schema,
  path,
  data,
  enabled,
  renderers,
  cells,
}: LayoutProps) {
  const { dispatch } = useJsonForms()
  // The tester guarantees a VerticalLayout of the display + maxColumns controls
  const { elements } = uischema as VerticalLayout
  const { display } = data as Pick<InfoCardsProps, "display">
  const hasDisplay = elements.some(
    (element) => (element as ControlElement).scope === DISPLAY_SCOPE,
  )
  // Column count only applies when extra cards wrap to the next line.
  // Display is rendered here, not dispatched, so the two options stay side by side.
  const visibleElements = elements.filter((element) => {
    const scope = (element as ControlElement).scope
    if (scope === DISPLAY_SCOPE) return false
    if (display === INFOCARDS_DISPLAY.carousel && scope === MAX_COLUMNS_SCOPE) {
      return false
    }
    return true
  })
  const selectedDisplay = display ?? INFOCARDS_DISPLAY.wrap

  return (
    <Box w="100%" display="flex" flexDirection="column" gap="1.25rem">
      {hasDisplay && (
        <FormControl isRequired isDisabled={enabled === false} gap="0.5rem">
          <FormLabel description="Applies when there are more cards than fit on one line.">
            Extra cards
          </FormLabel>
          <Radio.RadioGroup
            display="flex"
            flexDir="row"
            gap={2}
            value={selectedDisplay}
            isDisabled={enabled === false}
            onChange={(value) => {
              dispatch?.(update(composePaths(path, "display"), () => value))
            }}
          >
            <Radio
              value={INFOCARDS_DISPLAY.wrap}
              allowDeselect={false}
              size="sm"
            >
              Wrap to the next line
              <Box mt="0.625rem">
                <IconInfoCardsWrap />
              </Box>
            </Radio>
            <Radio
              value={INFOCARDS_DISPLAY.carousel}
              allowDeselect={false}
              size="sm"
            >
              Show as a carousel
              <Box mt="0.625rem">
                <IconInfoCardsCarousel />
              </Box>
            </Radio>
          </Radio.RadioGroup>
        </FormControl>
      )}
      {visibleElements.map((element, index) => (
        <JsonFormsDispatch
          key={`${path}-${index}`}
          uischema={element}
          schema={schema}
          path={path}
          enabled={enabled}
          renderers={renderers}
          cells={cells}
        />
      ))}
    </Box>
  )
}

export default withJsonFormsLayoutProps(JsonFormsInfoCardsLayout)
