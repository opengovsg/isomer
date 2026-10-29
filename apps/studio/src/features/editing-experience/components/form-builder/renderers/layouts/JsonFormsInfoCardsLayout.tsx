import type {
  ControlElement,
  LayoutProps,
  RankedTester,
  VerticalLayout,
} from "@jsonforms/core"
import type { InfoCardsProps } from "@opengovsg/isomer-components"
import {
  Box,
  FormControl,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useDisclosure,
} from "@chakra-ui/react"
import { composePaths, rankWith, update } from "@jsonforms/core"
import {
  JsonFormsDispatch,
  useJsonForms,
  withJsonFormsLayoutProps,
} from "@jsonforms/react"
import {
  Button,
  FormLabel,
  ModalCloseButton,
  Radio,
} from "@opengovsg/design-system-react"
import {
  INFOCARDS_CAROUSEL_MAX_CARDS,
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
  const { display, cards } = data as Pick<InfoCardsProps, "display" | "cards">
  const { isOpen, onOpen, onClose } = useDisclosure()
  const cardsToRemove = cards.length - INFOCARDS_CAROUSEL_MAX_CARDS
  const cardsPath = composePaths(path, "cards")
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
            Cards layout
          </FormLabel>
          <Radio.RadioGroup
            display="flex"
            flexDir="row"
            gap={2}
            value={selectedDisplay}
            isDisabled={enabled === false}
            onChange={(value) => {
              dispatch?.(update(composePaths(path, "display"), () => value))
              if (value === INFOCARDS_DISPLAY.carousel && cardsToRemove > 0) {
                onOpen()
              }
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
      {/* Returning focus to the radio on close scrolls it back into view,
          cancelling the "Go to cards" scroll */}
      <Modal isOpen={isOpen} onClose={onClose} returnFocusOnClose={false}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader mr="3.5rem">Too many cards for a carousel</ModalHeader>
          <ModalCloseButton size="lg" />
          <ModalBody>
            <Text textStyle="body-1">
              A carousel can have up to {INFOCARDS_CAROUSEL_MAX_CARDS} cards.
              Remove {cardsToRemove} {cardsToRemove === 1 ? "card" : "cards"} to
              use it.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button
              onClick={() => {
                onClose()
                document
                  .querySelector(`[data-path="${cardsPath}"]`)
                  ?.scrollIntoView({ behavior: "smooth", block: "start" })
              }}
            >
              Go to cards
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}

export default withJsonFormsLayoutProps(JsonFormsInfoCardsLayout)
