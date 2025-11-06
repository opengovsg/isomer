import type { ButtonProps as AriaButtonProps } from "react-aria-components"
import type { VariantProps } from "tailwind-variants"

import type { buttonStyles } from "../Button/common"
import type { getButtonClassNames, getIconClassNames } from "./styles"

export interface DownloadButtonProps
  extends Omit<AriaButtonProps, "className">,
    VariantProps<typeof buttonStyles> {
  url: string // URL to download the file from
  className?: string // Only string className supported (server component)
}

export interface DownloadButtonClientProps
  extends Omit<DownloadButtonProps, "className"> {
  buttonClassNames: ReturnType<typeof getButtonClassNames>
  iconClassNames: ReturnType<typeof getIconClassNames>
}
