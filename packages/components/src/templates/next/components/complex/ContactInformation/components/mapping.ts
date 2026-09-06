import type { IconType } from "react-icons"
import type { CONTACT_INFORMATION_SUPPORT_METHODS } from "~/interfaces/complex/ContactInformation/constants"
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

type MethodMapping = Record<
  (typeof CONTACT_INFORMATION_SUPPORT_METHODS)[number],
  {
    label: string
    Icon: IconType
    color?: string
  }
>

export const METHODS_MAPPING = {
  address: {
    Icon: BiMap,
    label: "Address",
  },
  email: {
    Icon: BiMailSend,
    label: "Email",
  },
  emergency_contact: {
    Icon: BiPhoneCall,
    color: "text-utility-feedback-alert",
    label: "Emergency Contact",
  },
  fax: {
    Icon: BiPrinter,
    label: "Fax",
  },
  operating_hours: {
    Icon: BiTimeFive,
    label: "Operating Hours",
  },
  person: {
    Icon: BiUser,
    label: "Person",
  },
  telephone: {
    Icon: BiPhone,
    label: "Telephone",
  },
  website: {
    Icon: BiGlobe,
    label: "Website",
  },
} satisfies MethodMapping
