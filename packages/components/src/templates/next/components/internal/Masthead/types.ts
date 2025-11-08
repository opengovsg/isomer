import type { PropsWithChildren } from "react"

import type { getMastheadButtonClassNames } from "./styles"
import type { MastheadProps } from "~/interfaces"

type MastheadButtonClassNames = ReturnType<typeof getMastheadButtonClassNames>

export interface MastheadClientProps extends Omit<MastheadProps, "type"> {
  mobileButtonClassNames: MastheadButtonClassNames
  desktopButtonClassNames: MastheadButtonClassNames
}

export interface RestrictedHeaderBarProps extends PropsWithChildren {
  mobileButtonClassNames: MastheadButtonClassNames
  desktopButtonClassNames: MastheadButtonClassNames
}
