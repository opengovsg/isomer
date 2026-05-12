import { HStack, Icon, Text } from "@chakra-ui/react"
import { BiCheckCircle, BiError, BiLoaderAlt, BiTimeFive } from "react-icons/bi"

import type { GazetteStatus } from "./types"

interface StatusConfig {
  icon: typeof BiCheckCircle
  label: string
  color: string
}

const STATUS_CONFIG: Record<GazetteStatus, StatusConfig> = {
  published: {
    icon: BiCheckCircle,
    label: "Published",
    color: "utility.feedback.success",
  },
  scheduled: {
    icon: BiTimeFive,
    label: "Scheduled",
    color: "yellow.400",
  },
  scanning: {
    icon: BiLoaderAlt,
    label: "Scanning",
    color: "yellow.400",
  },
  "publish-failure": {
    icon: BiError,
    label: "Publish failure",
    color: "utility.feedback.critical",
  },
  "scanning-failure": {
    icon: BiError,
    label: "Scanning failure",
    color: "utility.feedback.critical",
  },
  "parsing-failure": {
    icon: BiError,
    label: "Parsing failure",
    color: "utility.feedback.critical",
  },
  "upload-failure": {
    icon: BiError,
    label: "Upload failure",
    color: "utility.feedback.critical",
  },
}

interface StatusCellProps {
  status: GazetteStatus
}

export const StatusCell = ({ status }: StatusCellProps): JSX.Element => {
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
