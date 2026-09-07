import type { IsomerComponent } from "@opengovsg/isomer-components"
import { VStack } from "@chakra-ui/react"
import {
  getComponentSchema,
  ISOMER_USABLE_PAGE_LAYOUTS,
} from "@opengovsg/isomer-components"
import { BiCog, BiData, BiPin, BiSlider } from "react-icons/bi"
import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { CanManageCollectionFilters } from "~/features/editing-experience/hooks/canManageCollectionFilters"
import { useSelectBlock } from "~/features/editing-experience/hooks/useSelectBlock"
import { useNewCollectionTagsManagement } from "~/hooks/useNewCollectionTagsManagement"
import { ajv } from "~/utils/ajv"

import { TYPE_TO_ICON } from "../../constants"
import { getIsHeroFirstBlock } from "../../utils/getIsHeroFirstBlock"
import { BaseBlock } from "../Block/BaseBlock"

const validateHeroComponentFn = ajv.compile<IsomerComponent>(
  getComponentSchema({ component: "hero" }),
)

export const invalidBlockDescription = "Fix errors in this block to publish"

interface FixedBlockContent {
  label: string
  description: string
}

const FIXED_BLOCK_CONTENT = {
  article: {
    description: "Category, Date, and Summary",
    label: "Article page header",
  },
  content: {
    description: "Summary, Button label, and Button destination",
    label: "Content page header",
  },
  database: {
    description: "Summary, Button label, and Button URL",
    label: "Database page header",
  },
  index: {
    description: "Summary, Button label and Button URL",
    label: "Header",
  },
} as const satisfies Record<string, FixedBlockContent>

const getFixedBlockContent = (
  layout: string,
): FixedBlockContent | undefined => {
  if (!Object.hasOwn(FIXED_BLOCK_CONTENT, layout)) {return undefined}
  // SAFETY: Object.hasOwn confirms layout is a key of FIXED_BLOCK_CONTENT
  return FIXED_BLOCK_CONTENT[layout as keyof typeof FIXED_BLOCK_CONTENT]
}

export const FixedBlock = () => {
  const { setDrawerState, previewPageState } = useEditorDrawerContext()
  const selectBlock = useSelectBlock()
  const pageLayout = previewPageState.layout
  const isHeroFixedBlock = getIsHeroFirstBlock(pageLayout, previewPageState)
  const isNewCollectionTagsManagementEnabled = useNewCollectionTagsManagement()

  if (isHeroFixedBlock) {
    // Assuming only one fixedBlock can exist at a time for now
    const fixedBlock = previewPageState.content[0]
    const isValid = validateHeroComponentFn(fixedBlock)
    return (
      <BaseBlock
        onClick={() =>{  selectBlock(0, { state: "heroEditor" }); }}
        label="Hero banner"
        description="Title, subtitle, and Call-to-Action"
        icon={TYPE_TO_ICON.hero}
        invalidProps={
          isValid ? undefined : { description: invalidBlockDescription }
        }
      />
    )
  }

  if (
    pageLayout === ISOMER_USABLE_PAGE_LAYOUTS.Collection &&
    isNewCollectionTagsManagementEnabled
  ) {
    // New collection editing UI introduced in https://github.com/opengovsg/isomer/pull/2002
    return (
      <>
        <BaseBlock
          variant="vertical"
          onClick={() =>{ 
            selectBlock(0, { state: "collectionEditor", type: "display" }); }
          }
          label="Collection display"
          description="Customise the Collection’s Summary, Layout, Sorting logic, and Thumbnail."
          icon={BiCog}
        />
        <CanManageCollectionFilters>
          <BaseBlock
            variant="vertical"
            onClick={() =>{ 
              selectBlock(0, { state: "collectionEditor", type: "filter" }); }
            }
            label="Filters"
            description="Define and manage filters for this Collection."
            icon={BiSlider}
          />
        </CanManageCollectionFilters>
      </>
    )
  }

  if (pageLayout === ISOMER_USABLE_PAGE_LAYOUTS.Collection) {
    return (
      <BaseBlock
        onClick={() =>{ 
          selectBlock(0, { state: "collectionEditor", type: "display" }); }
        }
        label="Collection settings"
        description="Summary, style, categories and sorting"
        icon={BiPin}
      />
    )
  }

  if (pageLayout === ISOMER_USABLE_PAGE_LAYOUTS.Database) {
    return (
      <VStack gap="1rem" w="100%" align="start">
        <BaseBlock
          onClick={() => {
            setDrawerState({ state: "metadataEditor" })
          }}
          label="Page header"
          description="Summary, Button label, and Button URL"
          icon={BiPin}
        />
        <BaseBlock
          onClick={() => {
            setDrawerState({ state: "databaseEditor" })
          }}
          label="Database"
          description="Link your dataset from Data.gov.sg"
          icon={BiData}
        />
      </VStack>
    )
  }

  return (
    <BaseBlock
      onClick={() => {
        setDrawerState({ state: "metadataEditor" })
      }}
      label={
        getFixedBlockContent(pageLayout)?.label ||
        "Page description and summary"
      }
      description={
        getFixedBlockContent(pageLayout)?.description || "Click to edit"
      }
      icon={BiPin}
    />
  )
}
