/* oxlint-disable typescript/no-unsafe-assignment, typescript/strict-boolean-expressions, eslint/no-unused-vars -- studio lint cleanup */
import type { IsomerComponent } from "@opengovsg/isomer-components"
import type { RequireAllOrNone } from "type-fest"
import type { DrawerState } from "~/types/editorDrawer"
import { chakra, Flex, Icon, Stack, Text, VStack } from "@chakra-ui/react"
import { useFeatureValue } from "@growthbook/growthbook-react"
import { Button, TouchableTooltip } from "@opengovsg/design-system-react"
import { useMemo } from "react"
import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { TYPE_TO_ICON } from "~/features/editing-experience/constants"
import { IS_HOMEPAGE_ANTI_SCAM_BANNER_ENABLED_FEATURE_KEY } from "~/lib/growthbook"
import { isNullableBooleanTrue } from "~/utils/truthiness"
import { ResourceType } from "~prisma/generated/generatedEnums"

import type { SectionType } from "./types"
import type { UsageTooltipProps } from "./UsageTooltip"
import {
  ARTICLE_ALLOWED_BLOCKS,
  BLOCK_TO_META,
  CONTENT_ALLOWED_BLOCKS,
  DATABASE_ALLOWED_BLOCKS,
  DEFAULT_BLOCKS,
  getHomepageAllowedBlocks,
  INDEX_ALLOWED_BLOCKS,
} from "./constants"
import { UsageTooltip } from "./UsageTooltip"

const Section = ({ children }: React.PropsWithChildren) => (
  <VStack gap="1rem" alignItems="start" w="full">
    {children}
  </VStack>
)

const SectionTitle = ({ title }: { title: string }) => (
  <Text textStyle="subhead-2" textColor="base.content.medium">
    {title}
  </Text>
)

const BlockList = ({ children }: React.PropsWithChildren) => (
  <Stack w="full">{children}</Stack>
)

type BlockItemProps = UsageTooltipProps & {
  onProceed: (sectionType: SectionType) => void
  sectionType: SectionType
} & RequireAllOrNone<{
    isDisabled: boolean
    disabledText: string
  }>

const BlockItem = ({
  onProceed,
  sectionType,
  isDisabled,
  disabledText,
  ...rest
}: BlockItemProps) => {
  const { icon, label, description } = rest

  const button = (
    <chakra.button
      disabled={isDisabled}
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
      onClick={() => {
        onProceed(sectionType)
      }}
      _disabled={{
        bg: "interaction.support.disabled",
        borderColor: "base.divider.medium",
        cursor: "not-allowed",
        opacity: "75%",
        textColor: "interaction.support.disabled-content",
      }}
      data-group
    >
      <Flex
        p="0.5rem"
        bg="interaction.main-subtle.default"
        borderRadius="full"
        _groupDisabled={{
          background: "interaction.neutral-subtle.default",
        }}
      >
        <Icon as={icon} fontSize="1rem" color="base.content.default" />
      </Flex>
      <Stack align="start" gap="0.25rem" textAlign="start">
        <Text textStyle="caption-1">{label}</Text>
        <Text textStyle="caption-2">{description}</Text>
      </Stack>
    </chakra.button>
  )

  if (isNullableBooleanTrue(isDisabled)) {
    return <TouchableTooltip label={disabledText}>{button}</TouchableTooltip>
  }

  return <UsageTooltip {...rest}>{button}</UsageTooltip>
}

const ComponentSelector = () => {
  const {
    setCurrActiveIdx,
    savedPageState,
    setDrawerState,
    setSavedPageState,
    setPreviewPageState,
    setAddedBlockIndex,
    type,
  } = useEditorDrawerContext()

  const isHomepageAntiScamBannerEnabled = useFeatureValue<boolean>(
    IS_HOMEPAGE_ANTI_SCAM_BANNER_ENABLED_FEATURE_KEY,
    false,
  )

  const onProceed = (sectionType: SectionType) => {
    if (
      sectionType === "childrenpages" &&
      savedPageState.content.some(
        (block) => block.type === "childrenpages" && block.isHidden,
      )
    ) {
      const nextPageState = {
        ...savedPageState,
        content: savedPageState.content.map((block) => {
          if (block.type === "childrenpages") {
            return { ...block, isHidden: false } satisfies IsomerComponent
          }

          return block satisfies IsomerComponent
        }),
      }
      const childrenpagesIdx = savedPageState.content.findIndex(
        (block) => block.type === "childrenpages",
      )
      setDrawerState({ state: "complexEditor" })
      setSavedPageState(nextPageState)
      setCurrActiveIdx(childrenpagesIdx)
      setAddedBlockIndex(childrenpagesIdx)
      setPreviewPageState(nextPageState)
      return
    }

    // Deferred: add new section to page/editor state
    // NOTE: Only paragraph should go to tiptap editor
    // the rest should use json forms
    const nextState: DrawerState["state"] =
      sectionType === "prose" ? "nativeEditor" : "complexEditor"
    const newComponent =
      // SAFETY: DEFAULT_BLOCKS keys align with sectionType and return valid Isomer components
      DEFAULT_BLOCKS[sectionType]

    const updatedBlocks = newComponent
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
      case ResourceType.RootPage: {
        return getHomepageAllowedBlocks({
          includeAntiScamBanner: isHomepageAntiScamBannerEnabled,
        })
      }
      case ResourceType.Page: {
        if (savedPageState.layout === "content") {
          return CONTENT_ALLOWED_BLOCKS
        } else if (savedPageState.layout === "article") {
          return ARTICLE_ALLOWED_BLOCKS
        } else if (savedPageState.layout === "database") {
          return DATABASE_ALLOWED_BLOCKS
        }
        throw new Error(`Unsupported page layout: ${savedPageState.layout}`)
      }
      case ResourceType.CollectionPage: {
        return ARTICLE_ALLOWED_BLOCKS
      }
      case ResourceType.Collection:
      case ResourceType.CollectionLink: {
        return []
      }
      case ResourceType.IndexPage: {
        return INDEX_ALLOWED_BLOCKS
      }
      case ResourceType.Folder:
      case ResourceType.FolderMeta:
      case ResourceType.CollectionMeta: {
        throw new Error(`Unsupported resource type: ${type}`)
      }
      default: {
        const exhaustiveCheck: never = type
        return exhaustiveCheck
      }
    }
  }, [isHomepageAntiScamBannerEnabled, savedPageState.layout, type])

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
        {availableBlocks.map((section) => (
          <Section key={section.label}>
            <SectionTitle title={section.label} />
            <BlockList>
              {section.types.map((typeValue) => {
                const blockMeta = BLOCK_TO_META[type]
                const isDisabled =
                  type === "childrenpages" &&
                  savedPageState.content.some(
                    (block) =>
                      block.type === "childrenpages" && !block.isHidden,
                  )

                return (
                  <BlockItem
                    key={type}
                    icon={TYPE_TO_ICON[type]}
                    onProceed={onProceed}
                    sectionType={type}
                    isDisabled={isDisabled}
                    disabledText="This page already has a child pages block."
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
