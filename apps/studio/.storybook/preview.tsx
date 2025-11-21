import "@fontsource/ibm-plex-mono"

import { mockDateDecorator } from "storybook-mock-date-decorator"

import "inter-ui/inter.css"

import { useCallback, useState } from "react"
import { Skeleton, Stack } from "@chakra-ui/react"
import { GrowthBook } from "@growthbook/growthbook"
import { GrowthBookProvider } from "@growthbook/growthbook-react"
import { ThemeProvider } from "@opengovsg/design-system-react"
import { withThemeFromJSXProvider } from "@storybook/addon-themes"
import {
  type Args,
  type Decorator,
  type Preview,
  type ReactRenderer,
} from "@storybook/nextjs"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { httpLink } from "@trpc/client"
import { createTRPCReact } from "@trpc/react-query"
import { merge } from "lodash"
import { initialize, mswLoader } from "msw-storybook-addon"
import { ErrorBoundary } from "react-error-boundary"
import superjson from "superjson"

import { viewport, withChromaticModes } from "@isomer/storybook-config"

import type { EnvContextReturn } from "~/components/AppProviders"
import type { AppRouter } from "~/server/modules/_app"
import { AppBanner } from "~/components/AppBanner"
import { EnvProvider } from "~/components/AppProviders"
import { DefaultFallback } from "~/components/ErrorBoundary"
import Suspense from "~/components/Suspense"
import { env } from "~/env.mjs"
import { LoginStateContext } from "~/features/auth"
import { theme } from "~/theme"

// Initialize MSW
initialize({
  onUnhandledRequest: "bypass",
})

const trpc = createTRPCReact<AppRouter>()

const StorybookEnvDecorator: Decorator = (story) => {
  const mockEnv: EnvContextReturn["env"] = merge(env, {
    NEXT_PUBLIC_APP_NAME: "Isomer Studio",
    NEXT_PUBLIC_APP_VERSION: "Storybook",
    // Required to be be empty string for storybook
    // so it will fallback to storybook static assets mock
    NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME: "",
  })
  return <EnvProvider env={mockEnv}>{story()}</EnvProvider>
}

const SetupDecorator: Decorator = (Story, { parameters }) => {
  const gb = new GrowthBook()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  gb.setForcedFeatures(new Map(parameters.growthbook ?? []))

  const [queryClient] = useState(
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: Infinity,
          retry: false,
          refetchOnWindowFocus: false,
        },
      },
    }),
  )
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [httpLink({ url: "", transformer: superjson })],
    }),
  )
  return (
    <GrowthBookProvider growthbook={gb}>
      <ErrorBoundary FallbackComponent={DefaultFallback}>
        <Suspense fallback={<Skeleton width="100%" height="100vh" />}>
          <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
              <Stack spacing={0} height="$100vh" flexDirection="column">
                <AppBanner />
                <Story />
              </Stack>
            </QueryClientProvider>
          </trpc.Provider>
        </Suspense>
      </ErrorBoundary>
    </GrowthBookProvider>
  )
}

/**
 * To use this decorator, you need to pass in a `getLayout` function in the story parameters.
 * @example
 * ```
  const meta: Meta<typeof ActivityAddPage> = {
    title: 'Pages/ActivityAddPage',
    component: ActivityAddPage,
    parameters: {
      getLayout: ActivityAddPage.getLayout,
    // ...
    },
  }
  ```
 */
const WithLayoutDecorator: Decorator = (Story, { parameters }) => {
  if (!parameters.getLayout) {
    return Story()
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  return <>{parameters.getLayout(<Story />)}</>
}

const LoginStateDecorator: Decorator<Args> = (story, { parameters }) => {
  const [hasLoginStateFlag, setLoginStateFlag] = useState(
    Boolean(parameters.loginState ?? true),
  )

  const setHasLoginStateFlag = useCallback(() => {
    setLoginStateFlag(true)
  }, [])

  const removeLoginStateFlag = useCallback(() => {
    setLoginStateFlag(false)
  }, [])

  return (
    <LoginStateContext.Provider
      value={{
        hasLoginStateFlag,
        removeLoginStateFlag,
        setHasLoginStateFlag,
      }}
    >
      {story()}
    </LoginStateContext.Provider>
  )
}

const conditionalMockDateDecorator: Decorator = (story, context) => {
  // NOTE: skip mockDateDecorator if explicitly disabled;
  // this is because the decorator calls `MockDate.reset` under the hood
  // which might interfere with renders in React
  if (context.parameters.disableMockDate) {
    return story()
  }

  return mockDateDecorator(story, context) as JSX.Element
}

const decorators: Decorator[] = [
  WithLayoutDecorator,
  SetupDecorator,
  StorybookEnvDecorator,
  withThemeFromJSXProvider<ReactRenderer>({
    themes: {
      default: theme,
    },
    Provider: ThemeProvider,
  }) as Decorator, // FIXME: Remove this cast when types are fixed
  LoginStateDecorator,
  conditionalMockDateDecorator,
]

const preview: Preview = {
  loaders: [mswLoader],
  decorators,
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/react/configure/story-layout
    layout: "fullscreen",
    // MOH site launch!!! aka birth of Isomer Next hehe
    date: new Date(2024, 10, 28),
    viewport,
    /**
     * If tablet view is needed, add it on a per-story basis.
     * @example
     * ```
     * export const SomeStory: Story = {
     *   parameters: {
     *     chromatic: withChromaticModes(["gsib", "desktop", "tablet"]),
     *   }
     * }
     * ```
     */
    chromatic: {
      ...withChromaticModes(["gsib"]),
      prefersReducedMotion: "reduce",
    },
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
}

export default preview
