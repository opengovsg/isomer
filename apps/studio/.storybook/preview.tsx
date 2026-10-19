import "@fontsource/ibm-plex-mono"
import type { EnvContextReturn } from "~/components/AppProviders"
import "inter-ui/inter.css"
import "~/styles/tiptap.scss"
import type { AppRouter } from "~/server/modules/_app"
import { Skeleton, Stack } from "@chakra-ui/react"
import { GrowthBookProvider } from "@growthbook/growthbook-react"
import { ThemeProvider } from "@opengovsg/design-system-react"
import { withThemeFromJSXProvider } from "@storybook/addon-themes"
import {
  type Args,
  type Decorator,
  type Preview,
  type ReactRenderer,
} from "@storybook/nextjs-vite"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { httpLink } from "@trpc/client"
import { createTRPCReact } from "@trpc/react-query"
import { merge } from "lodash-es"
import mockdate from "mockdate"
import { mswLoader } from "msw-storybook-addon/csf3"
import { setupWorker } from "msw/browser"
import { useCallback, useState } from "react"
import ReactDOM from "react-dom"
import { ErrorBoundary } from "react-error-boundary"
import { configure } from "storybook/test"
import superjson from "superjson"
import { AppBanner } from "~/components/AppBanner"
import { EnvProvider } from "~/components/AppProviders"
import { DefaultFallback } from "~/components/ErrorBoundary"
import Suspense from "~/components/Suspense"
import { env } from "~/env.mjs"
import { LoginStateContext } from "~/features/auth"
import { createMockGrowthBook } from "~/stories/utils/growthbook"
import { theme } from "~/theme"

import { viewport, withArgosModes } from "@isomer/storybook-config"

// Storybook's Next.js preview runs on Next's bundled React 19, which removed
// findDOMNode. react-input-mask and react-transition-group (used by OGP's
// design system and Chakra) still call it, so restore it by walking from the
// class instance's fiber to its first host node.
const legacyReactDOM = ReactDOM as {
  findDOMNode?: (instance: unknown) => unknown
}
legacyReactDOM.findDOMNode ??= (instance) => {
  if (instance instanceof Element) return instance
  let fiber = (instance as { _reactInternals?: Fiber } | null)?._reactInternals
  while (fiber) {
    if (fiber.stateNode instanceof Element) return fiber.stateNode
    fiber = fiber.child
  }
  return null
}
interface Fiber {
  stateNode: unknown
  child?: Fiber
}

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
  // oxlint-disable-next-line @typescript-eslint/no-unsafe-call
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
  // NOTE: skip mock date if explicitly disabled — resetting mockdate during
  // render can interfere with React.
  if (context.parameters.disableMockDate) {
    return story()
  }

  mockdate.reset()
  const date = context.parameters.date as Date | string | number | undefined
  if (date !== undefined) {
    mockdate.set(date)
  }
  return story()
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
  }),
  LoginStateDecorator,
  conditionalMockDateDecorator,
]

const preview: Preview = {
  // Stories load data through MSW and render Suspense skeletons first. The 1s
  // default for findBy*/waitFor is too short on a loaded CI runner, so wait
  // longer instead of failing the play function.
  beforeAll: () => {
    configure({ asyncUtilTimeout: 5000 })
  },

  loaders: [
    mswLoader(async () => {
      const worker = setupWorker()
      await worker.start({ onUnhandledFrame: "bypass" })
      return worker
    }),
  ],
  decorators,
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/react/configure/story-layout
    layout: "fullscreen",
    // MOH site launch!!! aka birth of Isomer Next hehe
    date: new Date(2024, 10, 28),
    viewport: {
      // Argos reads "100%" heights as 100px, which clips modals and drawers
      // (they render in portals), so give Studio a real viewport height.
      viewports: Object.fromEntries(
        Object.entries(viewport.viewports).map(([key, value]) => [
          key,
          { ...value, styles: { ...value.styles, height: "720px" } },
        ]),
      ),
    },
    /**
     * If tablet view is needed, add it on a per-story basis.
     * @example
     * ```
     * export const SomeStory: Story = {
     *   parameters: {
     *     argos: withArgosModes(["gsib", "desktop", "tablet"]),
     *   }
     * }
     * ```
     */
    argos: {
      ...withArgosModes(["gsib"]),
      // Modals and drawers render in portals, so cropping to the body's
      // content captures a sliver. Capture the whole viewport like Chromatic.
      fitToContent: false,
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
