import type { IconType } from "react-icons"
import {
  BiGlobe,
  BiMailSend,
  BiPhone,
  BiPrinter,
  BiTimeFive,
} from "react-icons/bi"

import type { ContactInformationProps } from "~/interfaces"

interface MethodMapping {
  label: string
  Icon: IconType
}

type MethodKeys = Extract<
  keyof ContactInformationProps,
  "telephone" | "fax" | "email" | "website" | "operatingHours"
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
  operatingHours: {
    label: "Operating Hours",
    Icon: BiTimeFive,
  },
}
