import type { IconType } from "react-icons"

import type { SupportedIconName } from "./icon-names"
import {
  BiBarChartAlt2,
  BiBookOpen,
  BiBuildings,
  BiBulb,
  BiCalendar,
  BiChart,
  BiChat,
  BiCheckShield,
  BiFile,
  BiGlobe,
  BiGroup,
  BiHelpCircle,
  BiIdCard,
  BiMapPin,
  BiNews,
  BiPhone,
  BiRightArrowAlt,
  BiStar,
  BiVideo,
} from "./clientBoxicons"
import { BiClipboardCheck } from "./custom-icons/BiClipboardCheck"
import { BiMegaphone } from "./custom-icons/BiMegaphone"

// TODO: use union types to support more icon libraries apart from react-icons
type SupportedIconType = IconType
export const SUPPORTED_ICONS_MAP: Record<SupportedIconName, SupportedIconType> =
  {
    "right-arrow": BiRightArrowAlt,
    "bar-chart": BiBarChartAlt2,
    "line-chart": BiChart,
    users: BiGroup,
    "office-building": BiBuildings,
    stars: BiStar,
    globe: BiGlobe,
    calendar: BiCalendar,
    "book-open": BiBookOpen,
    news: BiNews,
    file: BiFile,
    "help-circle": BiHelpCircle,
    phone: BiPhone,
    "id-card": BiIdCard,
    "map-pin": BiMapPin,
    chat: BiChat,
    megaphone: BiMegaphone,
    "clipboard-check": BiClipboardCheck,
    bulb: BiBulb,
    video: BiVideo,
    "check-shield": BiCheckShield,
  }
