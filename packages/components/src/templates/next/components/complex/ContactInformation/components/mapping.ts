import type { IconType } from "react-icons"
import {
  BiGlobe,
  BiMailSend,
  BiPhone,
  BiPhoneCall,
  BiPrinter,
  BiTimeFive,
} from "react-icons/bi"

import type { ContactInformationProps } from "~/interfaces"

interface MethodMapping {
  label: string
  Icon: IconType
  color?: string
}

type MethodKeys = Extract<
  keyof ContactInformationProps,
  | "telephone"
  | "fax"
  | "email"
  | "website"
  | "emergencyContact"
  | "operatingHours"
>

export const METHODS_MAPPING: Record<MethodKeys, MethodMapping> = {
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
  emergencyContact: {
    label: "Emergency Contact",
    Icon: BiPhoneCall,
    color: "text-utility-feedback-alert",
  },
  operatingHours: {
    label: "Operating Hours",
    Icon: BiTimeFive,
  },
}
