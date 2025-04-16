import "@fontsource/ibm-plex-mono" // Import if using code textStyles.
import "inter-ui/inter.css" // Strongly recommended.
import "../styles/tailwind.css"
import "../styles/editor/editorStyles.scss"

import type { AppProps, AppType } from "next/app"
import { Skeleton, Stack } from "@chakra-ui/react"
import { datadogRum } from "@datadog/browser-rum"
import { GrowthBook } from "@growthbook/growthbook"
import { GrowthBookProvider } from "@growthbook/growthbook-react"
import { ThemeProvider } from "@opengovsg/design-system-react"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { ErrorBoundary } from "react-error-boundary"

import { AppBanner } from "~/components/AppBanner"
import { EnvProvider } from "~/components/AppProviders"
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

datadogRum.init({
  applicationId: "32c64617-51e3-4a6e-a977-ad113021ffae",
  clientToken: "pub89baaf356268edcb9ed95847d7c5d679",
  // `site` refers to the Datadog site parameter of your organization
  // see https://docs.datadoghq.com/getting_started/site/
  site: "datadoghq.com",
  service: "isomer-next",
  env: env.NEXT_PUBLIC_APP_ENV,
  version: env.NEXT_PUBLIC_APP_VERSION,
  sessionSampleRate: 100,
  sessionReplaySampleRate: 100,
  trackUserInteractions: true,
  trackResources: true,
  trackLongTasks: true,
  defaultPrivacyLevel: "mask-user-input",
})

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
  return (
    <EnvProvider env={env}>
      <LoginStateProvider>
        <ThemeProvider theme={theme}>
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
