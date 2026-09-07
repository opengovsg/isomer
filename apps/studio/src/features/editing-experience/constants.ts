import type { IsomerSchema } from "@opengovsg/isomer-components"
import type { IconType } from "react-icons"
import {
  BiChevronDown,
  BiCloud,
  BiCrown,
  BiData,
  BiHash,
  BiImage,
  BiImages,
  BiListUl,
  BiLogoSpotify,
  BiMap,
  BiMessageDots,
  BiMoviePlay,
  BiPhoneCall,
  BiError,
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

export const TYPE_TO_ICON = {
  accordion: BiChevronDown,
  antiscambanner: BiError,
  audio: BiLogoSpotify,
  blockquote: BiMessageDots,
  button: BiPointer,
  callout: BiSolidQuoteAltLeft,
  childrenpages: BiListUl,
  collectionblock: BiData,
  contactinformation: BiPhoneCall,
  contentpic: ContentpicIcon,
  dynamiccomponentlist: BiListUl,
  dynamicdatabanner: TbApi,
  formsg: FormSGIcon,
  hero: BiCrown,
  iframe: FaYoutube,
  image: BiImage,
  imagegallery: BiImages,
  infobar: BiPointer,
  infocards: InfocardsIcon,
  infocols: InfocolsIcon,
  infopic: InfopicIcon,
  keystatistics: BiHash,
  logocloud: BiCloud,
  map: BiMap,
  prose: BiText,
  video: BiMoviePlay,
} satisfies Record<IsomerSchema["content"][number]["type"], IconType>

export const PUBLISHED_AFTER_EDITING_EVENT = "published-after-editing"
export const LEFT_EDITOR_AFTER_EDITING_EVENT = "left-editor-after-editing"
export type ContentEditSurveyEvent =
  | typeof PUBLISHED_AFTER_EDITING_EVENT
  | typeof LEFT_EDITOR_AFTER_EDITING_EVENT
