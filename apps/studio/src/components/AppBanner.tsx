import { Box, Link, useMultiStyleConfig } from "@chakra-ui/react"
import { Banner } from "@opengovsg/design-system-react"
import Markdown from "react-markdown"
import { APP_BANNER_ID, useBanner } from "~/hooks/useBanner"

export const AppBanner = () => {
  const banner = useBanner()
  const styles = useMultiStyleConfig("Banner", { variant: banner?.variant })

  return (
    banner && (
      <Box id={APP_BANNER_ID}>
        <Banner variant={banner.variant}>
          {/* Banner lays children out in a row; keep multiple paragraphs stacked */}
          <Box>
            <Markdown
              components={{
                a: ({ href, children }) => (
                  <Link href={href} isExternal sx={styles.link}>
                    {children}
                  </Link>
                ),
              }}
            >
              {banner.message}
            </Markdown>
          </Box>
        </Banner>
      </Box>
    )
  )
}
