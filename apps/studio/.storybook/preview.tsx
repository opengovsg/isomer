import "@fontsource/ibm-plex-mono"
import type { EnvContextReturn } from "~/components/AppProviders"
import "inter-ui/inter.css"
import "~/styles/tiptap.scss"
import type { AppRouter } from "~/server/modules/_app"
import { Skeleton, Stack } from "@chakra-ui/react"
import { GrowthBookProvider } from "@growthbook/growthbook-react"
import { ThemeProvider } from "@opengovsg/design-system-react"
import { withThemeFromJSXProvider } from "@storybook/addon-themes"
import type {
  Args,
  Decorator,
  Preview,
  ReactRenderer,
} from "@storybook/nextjs"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { httpLink } from "@trpc/client"
import { createTRPCReact } from "@trpc/react-query"
import { merge } from "lodash-es"
import mockdate from "mockdate"
import { mswLoader } from "msw-storybook-addon/csf3"
import { setupWorker } from "msw/browser"
import { useCallback, useMemo, useState } from "react"
import { ErrorBoundary } from "react-error-boundary"
import superjson from "superjson"
import { AppBanner } from "~/components/AppBanner"
import { EnvProvider } from "~/components/AppProviders"
import { DefaultFallback } from "~/components/ErrorBoundary"
import Suspense from "~/components/Suspense"
import { env } from "~/env.mjs"
import { LoginStateContext } from "~/features/auth"
import { createMockGrowthBook } from "~/stories/utils/growthbook"
import { theme } from "~/theme"

import { viewport, withChromaticModes } from "@isomer/storybook-config"

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
  // oxlint-disable-next-line @typescript-eslint/no-unsafe-argument
  const gb = createMockGrowthBook(new Map(parameters.growthbook ?? []))

  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: false,
            staleTime: Infinity,
          },
        },
      }),
    [],
  )
  const trpcClient = useMemo(
    () =>
      trpc.createClient({
        links: [httpLink({ transformer: superjson, url: "" })],
      }),
    [],
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
  // oxlint-disable-next-line @typescript-eslint/no-unsafe-call
  return <>{parameters.getLayout(<Story />)}</>
}

const LoginStateDecorator: Decorator<Args> = (story, { parameters }) => {
  const [hasLoginStateFlag, setHasLoginStateFlag] = useState(
    Boolean(parameters.loginState ?? true),
  )

  const setHasLoginStateFlagTrue = useCallback(() => {
    setHasLoginStateFlag(true)
  }, [])

  const removeLoginStateFlag = useCallback(() => {
    setHasLoginStateFlag(false)
  }, [])

  const contextValue = useMemo(
    () => ({
      hasLoginStateFlag,
      removeLoginStateFlag,
      setHasLoginStateFlag: setHasLoginStateFlagTrue,
    }),
    [hasLoginStateFlag, removeLoginStateFlag, setHasLoginStateFlagTrue],
  )

  return (
    <LoginStateContext.Provider value={contextValue}>
      {story()}
    </LoginStateContext.Provider>
  )
}

type StoryDateParam = string | number | Date | null | undefined

const parseMockDateParam = (
  value: StoryDateParam,
): string | number | Date | undefined => {
  if (value instanceof Date) {
    return value
  }
  if (Object.prototype.toString.call(value) === "[object String]") {
    // SAFETY: [object String] tag confirms a string primitive.
    return value as string
  }
  if (Object.prototype.toString.call(value) === "[object Number]") {
    // SAFETY: [object Number] tag confirms a number primitive.
    return value as number
  }
  return undefined
}

const conditionalMockDateDecorator: Decorator = (story, context) => {
  // NOTE: skip mock date if explicitly disabled — resetting mockdate during
  // render can interfere with React.
  if (context.parameters.disableMockDate) {
    return story()
  }

  mockdate.reset()
  // SAFETY: Storybook parameters.date is optionally a Date, ISO string, or timestamp
  const dateParam = parseMockDateParam(
    context.parameters.date as StoryDateParam,
  )
  if (dateParam !== undefined) {
    mockdate.set(dateParam)
  }
  return story()
}

const decorators: Decorator[] = [
  WithLayoutDecorator,
  SetupDecorator,
  StorybookEnvDecorator,
  withThemeFromJSXProvider<ReactRenderer>({
    Provider: ThemeProvider,
    themes: {
      default: theme,
    },
  }),
  LoginStateDecorator,
  conditionalMockDateDecorator,
]

const preview: Preview = {
  decorators,
  loaders: [
    mswLoader(async () => {
      const worker = setupWorker()
      await worker.start({ onUnhandledRequest: "bypass" })
      return worker
    }),
  ],
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
