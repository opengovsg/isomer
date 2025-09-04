import type { IconType } from "react-icons"
import {
  BiGlobe,
  BiMailSend,
  BiMap,
  BiPhone,
  BiPhoneCall,
  BiPrinter,
  BiTimeFive,
  BiUser,
} from "react-icons/bi"

import type { SUPPORT_METHODS } from "~/interfaces/complex/ContactInformation"

type MethodMapping = Record<
  (typeof SUPPORT_METHODS)[number],
  {
    label: string
    Icon: IconType
    color?: string
  }
>

export const METHODS_MAPPING: MethodMapping = {
  telephone: {
    label: "Telephone",
    Icon: BiPhone,
  },
  fax: {
    label: "Fax",
    Icon: BiPrinter,
  },
  email: {
    label: "Email",
    Icon: BiMailSend,
  },
  website: {
    label: "Website",
    Icon: BiGlobe,
  },
  emergency_contact: {
    label: "Emergency Contact",
    Icon: BiPhoneCall,
    color: "text-utility-feedback-alert",
  },
  address: {
    label: "Address",
    Icon: BiMap,
  },
  operating_hours: {
    label: "Operating Hours",
    Icon: BiTimeFive,
  },
  person: {
    label: "Person",
    Icon: BiUser,
  },
}
