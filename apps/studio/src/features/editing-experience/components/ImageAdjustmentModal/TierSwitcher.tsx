import type { Breakpoint } from "@opengovsg/isomer-components"
import { HStack, Text, VStack, Wrap, WrapItem } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"

import type { ActiveTier } from "./adjustmentDraft"
import { tierOrder, tierRangeLabel } from "./adjustmentDraft"

interface TierSwitcherProps {
  // The component's configured breakpoints above base (config.tiers).
  configTiers: Breakpoint[]
  activeTier: ActiveTier
  onSelect: (tier: ActiveTier) => void
  // Whether a tier has its own crop (● ) vs inherits base (○).
  isCustomised: (tier: ActiveTier) => boolean
}

// Lets the editor pick which screen size to crop for. The selectable units are
// breakpoints (base + config.tiers), never previewStates — a component can have
// more preview panes than crop tiers (e.g. two desktop column layouts at one
// breakpoint), but <picture> art-directs by viewport only.
export const TierSwitcher = ({
  configTiers,
  activeTier,
  onSelect,
  isCustomised,
}: TierSwitcherProps): JSX.Element => {
  return (
    <VStack align="stretch" spacing="0.5rem" w="100%" flexShrink={0}>
      <Text textStyle="subhead-2">Crop per screen size</Text>
      <Wrap spacing="0.5rem">
        {tierOrder(configTiers).map((tier) => {
          const isActive = tier === activeTier
          const customised = isCustomised(tier)
          return (
            <WrapItem key={tier}>
              <Button
                size="xs"
                variant={isActive ? "solid" : "outline"}
                colorScheme="neutral"
                onClick={() => onSelect(tier)}
                aria-pressed={isActive}
              >
                <HStack spacing="0.375rem">
                  <Text
                    as="span"
                    aria-label={customised ? "customised" : "inherits default"}
                  >
                    {customised ? "●" : "○"}
                  </Text>
                  <Text as="span">{tierRangeLabel(tier, configTiers)}</Text>
                </HStack>
              </Button>
            </WrapItem>
          )
        })}
      </Wrap>
    </VStack>
  )
}
