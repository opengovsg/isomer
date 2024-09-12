import type { IsomerSchema } from "@opengovsg/isomer-components"
import type { IconType } from "react-icons"
import { BiHash, BiImage } from "react-icons/bi"

import { ContentpicIcon } from "./components/icons/Contentpic"

export const TYPE_TO_ICON: Partial<
  Record<IsomerSchema["content"][number]["type"], IconType>
> = {
  image: BiImage,
  infopic: BiImage,
  keystatistics: BiHash,
  contentpic: ContentpicIcon,
}
