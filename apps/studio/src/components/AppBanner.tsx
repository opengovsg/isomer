import { Box } from "@chakra-ui/react"
import { Banner } from "@opengovsg/design-system-react"

import { APP_BANNER_ID, useBanner } from "~/hooks/useBanner"

export const AppBanner = () => {
  const banner = useBanner()
  return (
    banner && (
      <Box id={APP_BANNER_ID}>
        <Banner variant={banner.variant}>{banner.message}</Banner>
      </Box>
    )
  )
}
