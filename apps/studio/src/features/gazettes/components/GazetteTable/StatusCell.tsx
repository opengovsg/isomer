import { HStack, Icon, Text } from "@chakra-ui/react"
import { BiCheckCircle, BiError, BiLoaderAlt, BiTimeFive } from "react-icons/bi"

import type { GazetteStatus } from "./types"

interface StatusConfig {
  icon: typeof BiCheckCircle
  label: string
  color: string
}

const STATUS_CONFIG = {
  "parsing-failure": {
    color: "utility.feedback.critical",
    icon: BiError,
    label: "Parsing failure",
  },
  "publish-failure": {
    color: "utility.feedback.critical",
    icon: BiError,
    label: "Publish failure",
  },
  published: {
    color: "utility.feedback.success",
    icon: BiCheckCircle,
    label: "Published",
  },
  scanning: {
    color: "yellow.400",
    icon: BiLoaderAlt,
    label: "Scanning",
  },
  "scanning-failure": {
    color: "utility.feedback.critical",
    icon: BiError,
    label: "Scanning failure",
  },
  scheduled: {
    color: "yellow.400",
    icon: BiTimeFive,
    label: "Scheduled",
  },
  "upload-failure": {
    color: "utility.feedback.critical",
    icon: BiError,
    label: "Upload failure",
  },
} satisfies Record<GazetteStatus, StatusConfig>

interface StatusCellProps {
  status: GazetteStatus
}

export const StatusCell = ({ status }: StatusCellProps): React.ReactNode => {
  const config = STATUS_CONFIG[status]

  return (
    <HStack spacing="0.25rem" align="center">
      <Icon as={config.icon} boxSize="1rem" color={config.color} />
      <Text textStyle="subhead-2" color={config.color}>
        {config.label}
      </Text>
    </HStack>
  )
}
