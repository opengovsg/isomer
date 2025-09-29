import type { IsomerSchema } from "@opengovsg/isomer-components"
import type { IconType } from "react-icons"
import {
  COLLECTION_BLOCK_TYPE,
  CONTACT_INFORMATION_TYPE,
  DYNAMIC_COMPONENT_LIST_TYPE,
  DYNAMIC_DATA_BANNER_TYPE,
  IMAGE_GALLERY_TYPE,
  SEARCHABLE_TABLE_TYPE,
} from "@opengovsg/isomer-components"
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
  BiTable,
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
  [DYNAMIC_DATA_BANNER_TYPE]: TbApi,
  [COLLECTION_BLOCK_TYPE]: BiData,
  [IMAGE_GALLERY_TYPE]: BiImages,
  [CONTACT_INFORMATION_TYPE]: BiPhoneCall,
  [DYNAMIC_COMPONENT_LIST_TYPE]: BiListUl,
  childrenpages: BiListUl,
  [SEARCHABLE_TABLE_TYPE]: BiTable,
}
