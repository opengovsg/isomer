import type { IsomerSchema } from "@opengovsg/isomer-components"
import type { IconType } from "react-icons"
import { COMPONENT_TYPES_MAP } from "@opengovsg/isomer-components"
import {
  BiChevronDown,
  BiCloud,
  BiCrown,
  BiData,
  BiHash,
  BiImage,
  BiImages,
  BiListUl,
  BiMap,
  BiMessageDots,
  BiMoviePlay,
  BiPhoneCall,
  BiPointer,
  BiSolidQuoteAltLeft,
  BiText,
} from "react-icons/bi"
import { FaYoutube } from "react-icons/fa"
import { TbApi } from "react-icons/tb"

import { ContentpicIcon } from "./components/icons/Contentpic"
import { FormSGIcon } from "./components/icons/FormSG"
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
  formsg: FormSGIcon,
  hero: BiCrown,
  iframe: FaYoutube,
  map: BiMap,
  video: BiMoviePlay,
  logocloud: BiCloud,
  blockquote: BiMessageDots,
  [COMPONENT_TYPES_MAP.DynamicDataBanner]: TbApi,
  [COMPONENT_TYPES_MAP.CollectionBlock]: BiData,
  [COMPONENT_TYPES_MAP.ImageGallery]: BiImages,
  [COMPONENT_TYPES_MAP.ContactInformation]: BiPhoneCall,
  [COMPONENT_TYPES_MAP.DynamicComponentList]: BiListUl,
  childrenpages: BiListUl,
}
