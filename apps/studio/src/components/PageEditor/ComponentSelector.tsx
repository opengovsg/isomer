import {
  Flex,
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
  Text,
  VStack,
  Wrap,
} from "@chakra-ui/react"
import { Button, IconButton } from "@opengovsg/design-system-react"
import { type IsomerComponent } from "@opengovsg/isomer-components"
import { type IconType } from "react-icons"
import {
  BiCard,
  BiColumns,
  BiDollar,
  BiExpandVertical,
  BiImage,
  BiImages,
  BiMap,
  BiMovie,
  BiQuestionMark,
  BiSolidHandUp,
  BiSolidQuoteAltLeft,
  BiText,
  BiX,
} from "react-icons/bi"

import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { type DrawerState } from "~/types/editorDrawer"
import { trpc } from "~/utils/trpc"
import { DEFAULT_BLOCKS } from "./constants"
import { type SectionType } from "./types"

function Section({ children }: React.PropsWithChildren) {
  return (
    <VStack gap="0.5rem" alignItems="start">
      {children}
    </VStack>
  )
}

function SectionTitle({ title }: { title: string }) {
  return (
    <Text textStyle="subhead-3" textColor="base.content.medium">
      {title}
    </Text>
  )
}

function BlockList({ children }: React.PropsWithChildren) {
  return <Wrap spacing="0">{children}</Wrap>
}

function BlockItem({
  icon: Icon,
  label,
  onProceed,
  sectionType,
  description,
}: {
  icon: IconType
  label: string
  onProceed: (sectionType: SectionType) => void
  sectionType: SectionType
  description: string
}) {
  return (
    <Popover trigger="hover" placement="right">
      <PopoverTrigger>
        <Button
          m="0.75rem"
          w="6rem"
          h="6rem"
          variant="clear"
          colorScheme="neutral"
          onClick={() => onProceed(sectionType)}
        >
          <VStack gap="0.5rem" color="base.content.default">
            <Icon size="1.25rem" />
            <Text textStyle="caption-1">{label}</Text>
          </VStack>
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <PopoverArrow />
        <VStack p="1.5rem" alignItems="start" gap="0.75rem">
          <Flex alignItems="center" gap="0.5rem">
            <Icon size="1.25rem" />
            <Text textStyle="subhead-2">{label}</Text>
          </Flex>
          <Text textStyle="body-2">{description}</Text>
        </VStack>
      </PopoverContent>
    </Popover>
  )
}

function ComponentSelector() {
  const {
    setCurrActiveIdx,
    savedPageState,
    setDrawerState,
    setSavedPageState,
    setPreviewPageState,
  } = useEditorDrawerContext()
  const { mutate } = trpc.page.updatePageBlob.useMutation()
  // TODO: get this dynamically
  const pageId = 1
  const siteId = 1
  const [page] = trpc.page.readPageAndBlob.useSuspenseQuery({
    pageId,
    siteId,
  })
  const onProceed = (sectionType: SectionType) => {
    // NOTE: Only paragraph should go to tiptap editor
    // the rest should use json forms
    const nextState: DrawerState["state"] =
      sectionType === "prose" ? "nativeEditor" : "complexEditor"
    // TODO: Remove assertion after default blocks all in
    const newComponent: IsomerComponent | undefined =
      DEFAULT_BLOCKS[sectionType]

    const nextPageState = !!newComponent
      ? [...savedPageState, newComponent]
      : savedPageState
    setSavedPageState(nextPageState)
    setDrawerState({ state: nextState })
    setCurrActiveIdx(nextPageState.length - 1)
    setPreviewPageState(savedPageState)
  }

  return (
    <VStack w="full" gap="0">
      <Flex
        w="full"
        py="1.25rem"
        px="2rem"
        alignItems="center"
        justifyContent="space-between"
        borderBottom="solid"
        borderWidth="1px"
        borderColor="base.divider.medium"
      >
        <VStack alignItems="start">
          <Text as="h5" textStyle="h5">
            Add a new block
          </Text>
          <Text textStyle="body-2">Click a block to add to the page</Text>
        </VStack>
        <IconButton
          size="lg"
          variant="clear"
          colorScheme="neutral"
          color="interaction.sub.default"
          aria-label="Close add component"
          icon={<BiX />}
          onClick={() => {
            setDrawerState({ state: "root" })
          }}
        />
      </Flex>
      <VStack p="2rem" w="full" gap="1.25rem" alignItems="start">
        <Section>
          <SectionTitle title="Basic Building Blocks" />
          <BlockList>
            <BlockItem
              label="Prose"
              icon={BiText}
              onProceed={onProceed}
              sectionType="prose"
              description="Add text to your page - lists, headings, paragraph, and links."
            />
            <BlockItem
              label="Image"
              icon={BiImage}
              onProceed={onProceed}
              sectionType="image"
              description="TODO"
            />
          </BlockList>
        </Section>
        <Section>
          <SectionTitle title="Highlight Important Information" />
          <BlockList>
            <BlockItem
              label="Statistics"
              icon={BiDollar}
              onProceed={onProceed}
              sectionType="keystatistics"
              description="TODO"
            />
            <BlockItem
              label="Callout"
              icon={BiSolidQuoteAltLeft}
              onProceed={onProceed}
              sectionType="callout"
              description="TODO"
            />
            <BlockItem
              label="Text with button"
              icon={BiSolidHandUp}
              onProceed={onProceed}
              sectionType="infobar"
              description="TODO"
            />
            <BlockItem
              label="Text with image"
              icon={BiImages}
              onProceed={onProceed}
              sectionType="infopic"
              description="TODO"
            />
          </BlockList>
        </Section>
        <Section>
          <SectionTitle title="Organise Content" />
          {/* TODO: this should map over the schema and take values + components from there */}
          <BlockList>
            <BlockItem
              label="Cards"
              icon={BiCard}
              onProceed={onProceed}
              sectionType="infocards"
              description="TODO"
            />
            <BlockItem
              label="Columns"
              icon={BiColumns}
              onProceed={onProceed}
              sectionType="infocols"
              description="TODO"
            />
            <BlockItem
              label="Accordion"
              icon={BiExpandVertical}
              onProceed={onProceed}
              sectionType="accordion"
              description="TODO"
            />
          </BlockList>
        </Section>
        <Section>
          <SectionTitle title="External Content" />
          <BlockList>
            <BlockItem
              label="YouTube"
              icon={BiMovie}
              onProceed={onProceed}
              sectionType="iframe"
              description="TODO"
            />
            <BlockItem
              label="Google Maps"
              icon={BiMap}
              onProceed={onProceed}
              sectionType="iframe"
              description="TODO"
            />
            <BlockItem
              label="FormSG"
              icon={BiQuestionMark}
              onProceed={onProceed}
              sectionType="iframe"
              description="TODO"
            />
          </BlockList>
        </Section>
      </VStack>
    </VStack>
  )
}

export default ComponentSelector
