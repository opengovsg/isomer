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
import { createStore, Provider as JotaiProvider } from "jotai"
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
// Some pages render nothing while loading (`<Suspense fallback={null}>`), so
// the DOM alone can't tell they are still waiting. Track in-flight fetches
// (tRPC through MSW) and when the network last changed.
let pendingFetches = 0
let lastFetchActivity = 0
const originalFetch = globalThis.fetch
globalThis.fetch = async (...args) => {
  pendingFetches++
  lastFetchActivity = performance.now()
  try {
    return await originalFetch(...args)
  } finally {
    pendingFetches--
    lastFetchActivity = performance.now()
  }
}

// Argos only waits for images in the top document, and the Storybook SDK
// turns off its aria-busy wait. So it would capture Suspense skeletons and the
// page preview (a same-origin iframe) before their data, styles and images
// land. Loading Chakra skeletons are the only ones with an infinite animation.
const isPageSettled = () => {
  // ponytail: 300ms of network quiet lets React render a resolved query and
  // start any follow-up query; raise it if chained queries still get cut off.
  if (pendingFetches > 0 || performance.now() - lastFetchActivity < 300) {
    return false
  }
  const frameDocs = Array.from(document.querySelectorAll("iframe")).flatMap(
    (iframe) => (iframe.contentDocument ? [iframe.contentDocument] : []),
  )
  return [document, ...frameDocs].every((doc) => {
    const isSkeletonLoading = Array.from(
      doc.querySelectorAll<HTMLElement>(".chakra-skeleton"),
    ).some((el) => getComputedStyle(el).animationIterationCount === "infinite")
    if (isSkeletonLoading) return false
    if (doc === document) return true
    const images = Array.from(doc.images)
    images.forEach((img) => (img.loading = "eager"))
    return (
      images.every((img) => img.complete) &&
      Array.from(
        doc.querySelectorAll<HTMLLinkElement>("link[rel='stylesheet']"),
      ).every((link) => link.sheet)
    )
  })
}

const waitForPageSettledInVitest = async () => {
  if (!("__vitest_browser__" in globalThis)) return
  // ponytail: stories that stay loading on purpose (e.g. `Loading`) spend the
  // whole timeout here; add a parameter to skip them if that gets slow.
  // Not Date.now(): stories freeze it with mockdate, so it would never pass.
  const deadline = performance.now() + 5_000
  while (performance.now() < deadline && !isPageSettled()) {
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
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

// Jotai atoms otherwise live in one global store, so state such as an open
// settings modal leaks into every later story rendered in the same page.
const JotaiStoreDecorator: Decorator = (story) => {
  const [store] = useState(createStore)
  return <JotaiProvider store={store}>{story()}</JotaiProvider>
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
  JotaiStoreDecorator,
]

const preview: Preview = {
  // Stories load data through MSW and render Suspense skeletons first. The 1s
  // default for findBy*/waitFor is too short on a loaded CI runner, so wait
  // longer instead of failing the play function.
  beforeAll: () => {
    configure({ asyncUtilTimeout: 5000 })
  },
  afterEach: waitForPageSettledInVitest,

  loaders: [
    mswLoader(async () => {
      const worker = setupWorker()
      // Relative, so the worker resolves next to the Storybook even when it is
      // deployed under a sub-path (/components/, /studio/) instead of the root.
      await worker.start({
        onUnhandledFrame: "bypass",
        // Per-request logs flood the Vitest output on CI with thousands of entries.
        quiet: true,
        serviceWorker: { url: "./mockServiceWorker.js" },
      })
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
