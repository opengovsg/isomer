import type { BadgeProps } from "@opengovsg/design-system-react"
import { Badge } from "@opengovsg/design-system-react"

export const NewFeatureBadge = ({ ml = "0.75rem", ...rest }: BadgeProps) => (
  <Badge
    variant="subtle"
    colorScheme="success"
    bgColor="interaction.success-subtle.default"
    size="xs"
    px="0.5rem"
    py="0.25rem"
    ml={ml}
    {...rest}
  >
    New
  </Badge>
)
