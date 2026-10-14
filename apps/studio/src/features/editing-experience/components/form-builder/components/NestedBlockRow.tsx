import type { IsomerComponent } from "@opengovsg/isomer-components"
import type { ReactNode } from "react"
import type { IconType } from "react-icons"
import { Icon } from "@chakra-ui/react"
import {
  COLUMN_LAYOUT_LABELS,
  renderComponentPreviewText,
} from "@opengovsg/isomer-components"
import { BLOCK_TO_META } from "~/components/PageEditor/constants"
import { BaseBlock } from "~/features/editing-experience/components/Block/BaseBlock"
import { TYPE_TO_ICON } from "~/features/editing-experience/constants"

export const NESTED_BLOCK_INVALID_DESCRIPTION =
  "This block has missing or invalid content"

// Label shown for a block row inside a container. A Column summarises its
// layout and what sits in each slot, since its own preview text is only the
// layout name.
export const getNestedBlockLabel = (block: IsomerComponent): string => {
  if (block.type === "column") {
    const slots = block.columns
      .map((column) => column[0])
      .filter((child) => child !== undefined)
      .map((child) => BLOCK_TO_META[child.type].label)

    return `${COLUMN_LAYOUT_LABELS[block.variant]} · ${
      slots.length > 0 ? slots.join(", ") : "Empty"
    }`
  }

  const previewText = renderComponentPreviewText({ component: block })
  return previewText === ""
    ? `Empty ${BLOCK_TO_META[block.type].label.toLowerCase()}`
    : previewText
}

interface NestedBlockRowProps {
  block: IsomerComponent
  onClick: () => void
  // Hints at what clicking the row does: a chevron right opens a nested
  // drawer, a chevron down/up expands or collapses the row in place.
  trailingIcon: IconType
  isError?: boolean
  dragHandle?: ReactNode
}

export const NestedBlockRow = ({
  block,
  onClick,
  trailingIcon,
  isError = false,
  dragHandle,
}: NestedBlockRowProps) => {
  return (
    <BaseBlock
      icon={TYPE_TO_ICON[block.type]}
      label={getNestedBlockLabel(block)}
      description={BLOCK_TO_META[block.type].label}
      onClick={onClick}
      dragHandle={dragHandle}
      invalidProps={
        isError ? { description: NESTED_BLOCK_INVALID_DESCRIPTION } : undefined
      }
      trailing={
        <Icon
          as={trailingIcon}
          fontSize="1.25rem"
          color="base.content.medium"
          flexShrink={0}
          aria-hidden
        />
      }
    />
  )
}
