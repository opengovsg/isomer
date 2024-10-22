import "@fontsource/ibm-plex-mono" // Import if using code textStyles.
import "inter-ui/inter.css" // Strongly recommended.
import "../styles/tailwind.css"
import "../styles/editor/editorStyles.scss"

import type { AppProps, AppType } from "next/app"
import { Skeleton, Stack } from "@chakra-ui/react"
import { GrowthBook } from "@growthbook/growthbook"
import { GrowthBookProvider } from "@growthbook/growthbook-react"
import Intercom from "@intercom/messenger-js-sdk"
import { ThemeProvider } from "@opengovsg/design-system-react"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { ErrorBoundary } from "react-error-boundary"

import { AppBanner } from "~/components/AppBanner"
import { EnvProvider, FeatureProvider } from "~/components/AppProviders"
import { DefaultFallback } from "~/components/ErrorBoundary/DefaultFallback"
import Suspense from "~/components/Suspense"
import { VersionWrapper } from "~/components/VersionWrapper"
import { env } from "~/env.mjs"
import { LoginStateProvider } from "~/features/auth"
import { type NextPageWithLayout } from "~/lib/types"
import { DefaultLayout } from "~/templates/layouts/DefaultLayout"
import { theme } from "~/theme"
import { trpc } from "~/utils/trpc"

type AppPropsWithAuthAndLayout = AppProps & {
  Component: NextPageWithLayout
}

// Create a GrowthBook instance
const gb = new GrowthBook({
  apiHost: "https://cdn.growthbook.io",
  clientKey: env.NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY,
  enabled: true,
})

void gb.init({
  // Optional, enable streaming updates
  streaming: true,
})

const MyApp = ((props: AppPropsWithAuthAndLayout) => {
  if (env.NEXT_PUBLIC_INTERCOM_APP_ID) {
    Intercom({
      app_id: env.NEXT_PUBLIC_INTERCOM_APP_ID,
    })
  }

  return (
    <EnvProvider env={env}>
      <LoginStateProvider>
        <ThemeProvider theme={theme}>
          <FeatureProvider>
            <GrowthBookProvider growthbook={gb}>
              <ErrorBoundary FallbackComponent={DefaultFallback}>
                <Suspense fallback={<Skeleton width="100%" height="$100vh" />}>
                  <Stack spacing={0} height="$100vh" flexDirection="column">
                    <AppBanner />
                    <VersionWrapper />
                    <ChildWithLayout {...props} />
                    {/* eslint-disable-next-line no-restricted-properties */}
                    {process.env.NODE_ENV !== "production" && (
                      <ReactQueryDevtools initialIsOpen={false} />
                    )}
                  </Stack>
                </Suspense>
              </ErrorBoundary>
            </GrowthBookProvider>
          </FeatureProvider>
        </ThemeProvider>
      </LoginStateProvider>
    </EnvProvider>
  )
}) as AppType

// This is needed so suspense will be triggered for anything within the LayoutComponents which uses useSuspenseQuery
function ChildWithLayout({ Component, pageProps }: AppPropsWithAuthAndLayout) {
  const getLayout =
    Component.getLayout ?? ((page) => <DefaultLayout>{page}</DefaultLayout>)

  return <>{getLayout(<Component {...pageProps} />)}</>
}

export default trpc.withTRPC(MyApp)
