import type { IsomerSchema } from "@opengovsg/isomer-components"
import type { IconType } from "react-icons"
import {
  DYNAMIC_DATA_BANNER_TYPE,
  IMAGE_GALLERY_TYPE,
} from "@opengovsg/isomer-components"
import {
  BiChevronDown,
  BiCloud,
  BiCrown,
  BiHash,
  BiImage,
  BiImages,
  BiListUl,
  BiMap,
  BiMessageDots,
  BiMoviePlay,
  BiPointer,
  BiSolidQuoteAltLeft,
  BiText,
} from "react-icons/bi"
import { FaYoutube } from "react-icons/fa"
import { TbApi } from "react-icons/tb"

import { ContentpicIcon } from "./components/icons/Contentpic"
import { InfocardsIcon } from "./components/icons/Infocards"
import { InfocolsIcon } from "./components/icons/Infocols"
import { InfopicIcon } from "./components/icons/Infopic"

export const TYPE_TO_ICON: Record<
  IsomerSchema["content"][number]["type"],
  IconType
> = {
  prose: BiText,
  image: BiImage,
  infopic: InfopicIcon,
  keystatistics: BiHash,
  contentpic: ContentpicIcon,
  callout: BiSolidQuoteAltLeft,
  infocards: InfocardsIcon,
  infobar: BiPointer,
  infocols: InfocolsIcon,
  accordion: BiChevronDown,
  hero: BiCrown,
  iframe: FaYoutube,
  map: BiMap,
  video: BiMoviePlay,
  logocloud: BiCloud,
  blockquote: BiMessageDots,
  [DYNAMIC_DATA_BANNER_TYPE]: TbApi,
  [IMAGE_GALLERY_TYPE]: BiImages,
  childrenpages: BiListUl,
  // TODO: Add in these new block types
  // table: BiTable,
  // divider: DividerIcon,
  // iframe-gmap,
  // iframe-formsg
  // iframe-youtube
}

export const REFERENCE_LINK_REGEX = /\[resource:(\d+):(\d+)\]/
