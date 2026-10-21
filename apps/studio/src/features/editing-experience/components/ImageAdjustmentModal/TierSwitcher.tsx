import type { Breakpoint } from "@opengovsg/isomer-components"
import { Text, VStack, Wrap, WrapItem } from "@chakra-ui/react"
import { Button, Tooltip } from "@opengovsg/design-system-react"

import type { ActiveTier } from "./adjustmentDraft"
import { tierDeviceLabel, tierOrder, tierRangeLabel } from "./adjustmentDraft"

interface TierSwitcherProps {
  // The component's configured breakpoints above base (config.tiers).
  configTiers: Breakpoint[]
  activeTier: ActiveTier
  onSelect: (tier: ActiveTier) => void
  // Preview panes — used to label each tier by the device types it covers
  // (e.g. "Mobile and Tablet"); the exact px range stays on the tooltip.
  previewStates: readonly { viewportWidth?: number }[]
}

// Lets the editor pick which screen size to crop for. The selectable units are
// breakpoints (base + config.tiers), never previewStates — a component can have
// more preview panes than crop tiers (e.g. two desktop column layouts at one
// breakpoint), but <picture> art-directs by viewport only. Each chip is labelled
// by the device types it covers (derived from the governed previewStates), with
// the precise px range on hover. (Enabling per-screen cropping splits every
// breakpoint at once, so there's no per-tier customised/inherited distinction.)
export const TierSwitcher = ({
  configTiers,
  activeTier,
  onSelect,
  previewStates,
}: TierSwitcherProps): JSX.Element => {
  return (
    <VStack align="stretch" spacing="0.5rem" w="100%" flexShrink={0}>
      <Text textStyle="subhead-2">Crop per screen size</Text>
      <Wrap spacing="0.5rem">
        {/* Largest first: Desktop, Tablet, Mobile — the big screen reads as the
            primary crop, base (Mobile) last. tierOrder stays base-first for
            logic; only the display order is reversed here. */}
        {[...tierOrder(configTiers)].reverse().map((tier) => {
          const isActive = tier === activeTier
          const deviceLabel = tierDeviceLabel(tier, configTiers, previewStates)
          const rangeLabel = tierRangeLabel(tier, configTiers)
          return (
            <WrapItem key={tier}>
              <Tooltip label={rangeLabel}>
                <Button
                  size="xs"
                  variant="outline"
                  colorScheme="neutral"
                  onClick={() => onSelect(tier)}
                  aria-pressed={isActive}
                  // Both states need an explicit fill: the active chip's default
                  // "solid neutral" blended into the canvas, and inactive chips
                  // were near-invisible (borderless, canvas-coloured bg). Active =
                  // brand fill + white text; inactive = white fill + a divider
                  // border, so the selection is unmistakable and every chip reads
                  // as clickable.
                  bg={isActive ? "interaction.main.default" : "white"}
                  color={isActive ? "white" : undefined}
                  borderWidth="1px"
                  borderColor={
                    isActive
                      ? "interaction.main.default"
                      : "base.divider.medium"
                  }
                  _hover={
                    isActive
                      ? { bg: "interaction.main.hover" }
                      : { bg: "interaction.muted.neutral.hover" }
                  }
                >
                  {deviceLabel}
                </Button>
              </Tooltip>
            </WrapItem>
          )
        })}
      </Wrap>
    </VStack>
  )
}
