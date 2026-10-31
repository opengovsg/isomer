// Replace your-framework with the framework you are using (e.g., react, vue3)
import type { Decorator, Preview } from "@storybook/react-vite"
import { withThemeByDataAttribute } from "@storybook/addon-themes"
import mockdate from "mockdate"
import { mswLoader } from "msw-storybook-addon/csf3"
import { setupWorker } from "msw/browser"
import { MINIMAL_VIEWPORTS } from "storybook/viewport"
import "bootstrap-icons/font/bootstrap-icons.css"

import "../src/index.css"
import { viewport } from "@isomer/storybook-config"
import { applyViewportInVitest } from "@isomer/storybook-config/test-viewport"

const CUSTOM_GENERAL_VIEWPORTS = {
  smallDesktop: {
    name: "Small Desktop",
    styles: {
      width: "1280px",
      height: "720px",
    },
  },
  mediumDesktop: {
    name: "Medium Desktop",
    styles: {
      width: "1366px",
      height: "768px",
    },
  },
  largeDesktop: {
    name: "Large Desktop",
    styles: {
      width: "1920px",
      height: "1080px",
    },
  },
  iphone14: {
    name: "iPhone 12/13/14",
    styles: {
      width: "390px",
      height: "844px",
    },
  },
  iphone15ProMax: {
    name: "iPhone 14/15 Pro Max",
    styles: {
      width: "430px",
      height: "932px",
    },
  },
}

const CUSTOM_GSIB_VIEWPORTS = {
  gsibEdgeFav: {
    name: "GSIB Edge with Favorites Bar",
    styles: {
      width: "1272px",
      height: "652px",
    },
  },
  gsibEdge: {
    name: "GSIB Edge without Favorites Bar",
    styles: {
      width: "1272px",
      height: "686px",
    },
  },
  gsibChromeBookmarks: {
    name: "GSIB Chrome with Bookmarks Bar",
    styles: {
      width: "1280px",
      height: "651.33px",
    },
  },
  gsibChrome: {
    name: "GSIB Chrome without Bookmarks Bar",
    styles: {
      width: "1280px",
      height: "683.33px",
    },
  },
}

const ISOMER_QUERY_PARAM_KEYS = ["filters", "page", "search"] as const

const resetIsomerQueryParams = () => {
  const url = new URL(window.location.href)
  const previousSearch = url.search

  ISOMER_QUERY_PARAM_KEYS.forEach((key) => url.searchParams.delete(key))

  if (url.search !== previousSearch) {
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    )
  }
}

// `load` doesn't bubble, but a capturing listener still sees it for every
// iframe, including ones Argos re-renders right before its screenshot.
const loadedIframes = new WeakSet<EventTarget>()
document.addEventListener(
  "load",
  (event) => {
    if (event.target instanceof HTMLIFrameElement)
      loadedIframes.add(event.target)
  },
  true,
)

// Argos stabilization waits for images and fonts but not iframes, so embeds
// (maps, FormSG, Spotify) would be captured blank on a slow CI network.
// This afterEach runs inside the 15s story test and again for every viewport
// inside a 30s hook. A 15s wait plus a settle exceeds that test whenever an
// embed never fires `load`, and the shard then uploads nothing.
const IFRAME_WAIT_MS = 4_000
const IFRAME_SETTLE_MS = 1_000

const waitForIframesInVitest = async () => {
  if (!("__vitest_browser__" in globalThis)) return
  const iframes = Array.from(document.querySelectorAll("iframe"))
  if (iframes.length === 0) return
  iframes.forEach((iframe) => (iframe.loading = "eager"))
  // Not Date.now(): stories freeze it with mockdate, so it would never pass.
  const deadline = performance.now() + IFRAME_WAIT_MS
  while (
    performance.now() < deadline &&
    !iframes.every((iframe) => loadedIframes.has(iframe))
  ) {
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  // Settle only after `load`. An embed that never loads has nothing further
  // to paint, and the extra second is what pushed the old 15s wait over the
  // test limit.
  if (!iframes.every((iframe) => loadedIframes.has(iframe))) return
  await new Promise((resolve) => setTimeout(resolve, IFRAME_SETTLE_MS))
}

const preview: Preview = {
  // Storybook's preview iframe is a single persistent document, so query
  // state written by a previous story can leak into the next one. Reset only
  // Isomer's parameters before rendering; Storybook owns the other parameters
  // in the search string. A lifecycle hook keeps this side effect out of
  // React's render phase.
  beforeEach: async (context) => {
    resetIsomerQueryParams()
    await applyViewportInVitest(context)
  },
  afterEach: waitForIframesInVitest,

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

  parameters: {
    argos: {
      // Argos crops, pads and zooms the capture by default. Chromatic captured
      // the full viewport width as rendered.
      fitToContent: false,
    },
    viewport: {
      options: {
        ...viewport.viewports,
        ...MINIMAL_VIEWPORTS,
        ...CUSTOM_GENERAL_VIEWPORTS,
        ...CUSTOM_GSIB_VIEWPORTS,
      },
    },
    /**
     * If tablet view is needed, add it on a per-story basis.
     * @example
     * ```
     * export const SomeStory: Story = {
     *   parameters: {
     *     argos: withArgosModes(["mobile", "tablet", "desktop"]),
     *   }
     * }
     * ```
     */
  },

  tags: ["autodocs"],
}

const LayoutDecorator: Decorator = (Story) => (
  <div className="antialiased">
    <Story />
  </div>
)

const MockDateDecorator: Decorator = (Story) => {
  mockdate.reset()
  const defaultDate = "2025-08-09T12:00:00.000Z"
  mockdate.set(defaultDate)

  return <Story />
}

export const decorators: Decorator[] = [
  withThemeByDataAttribute({
    themes: {
      "Isomer Next": "isomer-next",
    },
    defaultTheme: "Isomer Next",
  }),
  LayoutDecorator,
  MockDateDecorator,
]

export default preview
