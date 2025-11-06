import type { DownloadButtonProps } from "./types"
import { DownloadButtonClient } from "./DownloadButtonClient"
import { getButtonClassNames, getIconClassNames } from "./styles"

/**
 * Generic button that allows users to download a file.
 * Supports multiple download strategies including DGS and direct file downloads.
 */
export const DownloadButton = ({
  className,
  variant,
  size,
  colorScheme,
  url,
  ...props
}: DownloadButtonProps) => {
  // Compute on server so tv/twMerge are not bundled on the client
  const buttonClassNames = getButtonClassNames({
    variant,
    colorScheme,
    size,
    className,
  })
  const iconClassNames = getIconClassNames({ size })

  return (
    <DownloadButtonClient
      {...props}
      url={url}
      buttonClassNames={buttonClassNames}
      iconClassNames={iconClassNames}
    />
  )
}
