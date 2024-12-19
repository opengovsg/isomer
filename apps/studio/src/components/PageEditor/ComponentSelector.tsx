import type { IsomerComponent } from "@opengovsg/isomer-components"
import { useMemo } from "react"
import Image from "next/image"
import {
  chakra,
  Flex,
  Icon,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { ResourceType } from "~prisma/generated/generatedEnums"
import { type IconType } from "react-icons"

import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { TYPE_TO_ICON } from "~/features/editing-experience/constants"
import { type DrawerState } from "~/types/editorDrawer"
import {
  ARTICLE_ALLOWED_BLOCKS,
  BLOCK_TO_META,
  CONTENT_ALLOWED_BLOCKS,
  DEFAULT_BLOCKS,
  HOMEPAGE_ALLOWED_BLOCKS,
} from "./constants"
import { type SectionType } from "./types"

function Section({ children }: React.PropsWithChildren) {
  return (
    <VStack gap="1rem" alignItems="start" w="full">
      {children}
    </VStack>
  )
}

function SectionTitle({ title }: { title: string }) {
  return (
    <Text textStyle="subhead-2" textColor="base.content.medium">
      {title}
    </Text>
  )
}

function BlockList({ children }: React.PropsWithChildren) {
  return <Stack w="full">{children}</Stack>
}

interface BlockItemProps {
  imageSrc?: string
  icon: IconType
  label: string
  onProceed: (sectionType: SectionType) => void
  sectionType: SectionType
  description: string
  usageText?: string
}

function BlockItem({
  icon,
  label,
  onProceed,
  sectionType,
  description,
  usageText,
  imageSrc,
}: BlockItemProps) {
  return (
    <Popover trigger="hover" placement="right" isLazy offset={[0, 20]}>
      <PopoverTrigger>
        <chakra.button
          layerStyle="focusRing"
          w="100%"
          borderRadius="6px"
          border="1px solid"
          borderColor="base.divider.medium"
          transitionProperty="common"
          transitionDuration="normal"
          _hover={{
            bg: "interaction.muted.main.hover",
            borderColor: "interaction.main-subtle.hover",
          }}
          bg="white"
          p="0.75rem"
          flexDirection="row"
          display="flex"
          alignItems="start"
          gap="0.75rem"
          onClick={() => onProceed(sectionType)}
        >
          <Flex
            p="0.5rem"
            bg="interaction.main-subtle.default"
            borderRadius="full"
          >
            <Icon as={icon} fontSize="1rem" color="base.content.default" />
          </Flex>
          <Stack align="start" gap="0.25rem" textAlign="start">
            <Text textStyle="caption-1">{label}</Text>
            <Text textStyle="caption-2">{description}</Text>
          </Stack>
        </chakra.button>
      </PopoverTrigger>
      <PopoverContent width="fit-content" overflow="hidden">
        <Flex flexDir="column" w="292px">
          {imageSrc && (
            <Image height={160} width={292} src={imageSrc} alt={label} />
          )}
          <VStack
            py="1rem"
            px="1.125rem"
            alignItems="start"
            gap="0.75rem"
            borderTop={imageSrc ? "1px solid" : undefined}
            borderColor="base.divider.medium"
          >
            <Flex alignItems="center" gap="0.25rem" w="full">
              <Icon as={icon} size="1.25rem" />
              <Text textStyle="subhead-2">{label}</Text>
            </Flex>
            <Text textStyle="body-2">{usageText ?? description}</Text>
          </VStack>
        </Flex>
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
    setAddedBlockIndex,
    type,
  } = useEditorDrawerContext()

  const onProceed = (sectionType: SectionType) => {
    // TODO: add new section to page/editor state
    // NOTE: Only paragraph should go to tiptap editor
    // the rest should use json forms
    const nextState: DrawerState["state"] =
      sectionType === "prose" ? "nativeEditor" : "complexEditor"
    // TODO: Remove assertion after default blocks all in
    const newComponent: IsomerComponent | undefined =
      DEFAULT_BLOCKS[sectionType]

    const updatedBlocks = !!newComponent
      ? [...savedPageState.content, newComponent]
      : savedPageState.content
    const nextPageState = {
      ...savedPageState,
      content: updatedBlocks,
    }
    setSavedPageState(nextPageState)
    setDrawerState({ state: nextState })
    setCurrActiveIdx(nextPageState.content.length - 1)
    setAddedBlockIndex(nextPageState.content.length - 1)
    setPreviewPageState(nextPageState)
  }

  const availableBlocks = useMemo(() => {
    switch (type) {
      case ResourceType.RootPage:
        return HOMEPAGE_ALLOWED_BLOCKS
      case ResourceType.Page:
        if (savedPageState.layout === "content") {
          return CONTENT_ALLOWED_BLOCKS
        } else if (savedPageState.layout === "article") {
          return ARTICLE_ALLOWED_BLOCKS
        }
        throw new Error(`Unsupported page layout: ${savedPageState.layout}`)
      case ResourceType.CollectionPage:
        return ARTICLE_ALLOWED_BLOCKS
      case ResourceType.Collection:
      case ResourceType.CollectionLink:
      case ResourceType.IndexPage:
        return []
      case ResourceType.Folder:
      case ResourceType.FolderMeta:
      case ResourceType.CollectionMeta:
        throw new Error(`Unsupported resource type: ${type}`)
      default:
        const exhaustiveCheck: never = type
        return exhaustiveCheck
    }
  }, [savedPageState.layout, type])

  return (
    <VStack w="full" h="full" gap="0">
      <Flex
        w="full"
        py="0.75rem"
        px="1.5rem"
        gap="0.75rem"
        alignItems="center"
        justifyContent="space-between"
        borderBottom="1px solid"
        borderColor="base.divider.medium"
        bg="white"
      >
        <VStack alignItems="start" gap="0.25rem">
          <Text textStyle="subhead-1">Add a new block</Text>
          <Text textStyle="caption-2" color="base.content.medium">
            Click a block to add to the page
          </Text>
        </VStack>
        <Button
          size="xs"
          variant="clear"
          onClick={() => {
            setDrawerState({ state: "root" })
          }}
        >
          Cancel
        </Button>
      </Flex>
      <VStack
        px="1.5rem"
        py="1.25rem"
        w="full"
        gap="1.25rem"
        alignItems="start"
        flex={1}
        overflow="auto"
      >
        {availableBlocks.map((section, index) => (
          <Section key={index}>
            <SectionTitle title={section.label} />
            <BlockList>
              {section.types.map((type) => {
                const blockMeta = BLOCK_TO_META[type]
                return (
                  <BlockItem
                    key={type}
                    icon={TYPE_TO_ICON[type]}
                    onProceed={onProceed}
                    sectionType={type}
                    {...blockMeta}
                  />
                )
              })}
            </BlockList>
          </Section>
        ))}
      </VStack>
    </VStack>
  )
}

export default ComponentSelector
